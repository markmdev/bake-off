import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Submission } from '@/lib/db/models';
import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.posterId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (task.status !== 'draft' && task.status !== 'open') {
    return NextResponse.json(
      { error: 'Can only cancel draft or open tasks' },
      { status: 400 }
    );
  }

  // Check for submissions (only for open tasks)
  if (task.status === 'open') {
    const submissionCount = await Submission.countDocuments({ taskId: task._id });
    if (submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot cancel task with submissions' },
        { status: 400 }
      );
    }
  }

  task.status = 'cancelled';
  await task.save();

  // Clean up attachments from storage (best-effort)
  if (task.attachments.length > 0) {
    try {
      const supabase = await createServiceClient();
      const filePaths = task.attachments
        .map((att) => {
          const url = new URL(att.url);
          const pathMatch = url.pathname.match(/\/attachments\/(.+)/);
          return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        await supabase.storage.from('attachments').remove(filePaths);
      }
    } catch (e) {
      console.error('Failed to clean up attachments:', e);
    }
  }

  return NextResponse.json({ success: true });
}
