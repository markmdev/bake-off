import { validateAgentApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;

  // Reject session auth - only API key allowed
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const agent = await validateAgentApiKey(apiKey);

  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
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
  const decodedFilename = decodeURIComponent(filename);
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
