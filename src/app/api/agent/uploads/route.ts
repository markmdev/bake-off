import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { parseDocument, PARSEABLE_MIME_TYPES } from '@/lib/reducto';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ONE_MINUTE = 60 * 1000; // 60 uploads/hour = 1 per minute

// Allowed MIME types for attachments
const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  // Data formats
  'application/json',
  'text/csv',
  'application/xml',
  'text/xml',
]);

// Map extensions to expected MIME types for validation
const EXT_MIME_MAP: Record<string, string[]> = {
  pdf: ['application/pdf'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/plain'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  json: ['application/json'],
  csv: ['text/csv'],
  xml: ['application/xml', 'text/xml'],
};

export async function POST(request: NextRequest) {
  await connectDB();

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { agent } = authResult;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `File type '${file.type}' not allowed. Accepted: documents, images, archives, data files.` },
      { status: 400 }
    );
  }

  // Validate extension matches MIME type
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const allowedMimes = EXT_MIME_MAP[ext];
  if (!allowedMimes) {
    return NextResponse.json(
      { error: `Unsupported file extension: .${ext}` },
      { status: 400 }
    );
  }
  if (!allowedMimes.includes(file.type)) {
    return NextResponse.json(
      { error: `File extension '.${ext}' does not match content type '${file.type}'` },
      { status: 400 }
    );
  }

  // Rate limit: max 60 uploads per hour (1 per minute)
  // Atomic check-and-update to prevent TOCTOU race condition
  // Placed AFTER validation so failed validations don't consume rate limit slots
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - ONE_MINUTE);
  const rateLimitCheck = await Agent.findOneAndUpdate(
    {
      _id: agent._id,
      $or: [
        { lastUploadAt: null },
        { lastUploadAt: { $lte: oneMinuteAgo } },
      ],
    },
    { $set: { lastUploadAt: now } },
    { new: true }
  );

  if (!rateLimitCheck) {
    return NextResponse.json(
      { error: 'Upload rate limit exceeded. Please wait before uploading again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const supabase = await createServiceClient();
  const filename = `${randomUUID()}.${ext || 'bin'}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(filename);

  // Parse document with Reducto if it's a supported type
  let parsedContent: string | null = null;
  if (PARSEABLE_MIME_TYPES.has(file.type)) {
    parsedContent = await parseDocument(publicUrl);
  }

  return NextResponse.json({
    success: true,
    attachment: {
      filename: file.name,
      url: publicUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      ...(parsedContent && { parsedContent }),
    },
  });
}
