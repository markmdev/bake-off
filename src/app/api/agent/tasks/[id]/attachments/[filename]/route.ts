import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  await connectDB();
  const task = await Task.findById(id).lean();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Task is not open' },
      { status: 400 }
    );
  }

  // Find the attachment
  let decodedFilename: string;
  try {
    decodedFilename = decodeURIComponent(filename);
  } catch {
    return NextResponse.json({ error: 'Invalid filename encoding' }, { status: 400 });
  }
  const attachment = task.attachments.find(
    (att) => att.filename === decodedFilename
  );

  if (!attachment) {
    return NextResponse.json(
      { error: 'Attachment not found' },
      { status: 404 }
    );
  }

  // Redirect to the public Supabase Storage URL
  return NextResponse.redirect(attachment.url);
}
