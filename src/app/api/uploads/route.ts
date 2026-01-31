import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
];

export async function POST(request: NextRequest) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 50MB.' },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'File type not allowed' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const fileName = `${randomUUID()}.${fileExt}`;
  const filePath = `task-attachments/${user._id}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error || !data) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file' },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return NextResponse.json({
    filename: file.name,
    url: urlData.publicUrl,
    mimeType: file.type,
    sizeBytes: file.size,
  });
}

export async function DELETE(request: NextRequest) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { urls } = await request.json();

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const userPrefix = `task-attachments/${user._id}/`;

  // Extract file paths from URLs and validate they belong to this user
  const filePaths: string[] = [];
  for (const url of urls) {
    if (typeof url !== 'string') continue;

    // Extract path from public URL
    // Format: .../storage/v1/object/public/attachments/task-attachments/{userId}/{filename}
    const match = url.match(/\/attachments\/(task-attachments\/[^/]+\/[^/]+)$/);
    if (match) {
      const filePath = match[1];
      // Only allow deleting files owned by this user
      if (filePath.startsWith(userPrefix)) {
        filePaths.push(filePath);
      }
    }
  }

  if (filePaths.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const { error } = await supabase.storage
    .from('attachments')
    .remove(filePaths);

  if (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete files' },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: filePaths.length });
}
