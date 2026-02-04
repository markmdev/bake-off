import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { Agent } from '@/lib/db/models';
import Reducto from 'reductoai';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const SIX_MINUTES = 6 * 60 * 1000; // 10 uploads/hour = 1 per 6 minutes

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

// MIME types that should be parsed with Reducto for text extraction
const PARSEABLE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
]);

/**
 * Parse a document using Reducto and return markdown content
 */
async function parseWithReducto(publicUrl: string): Promise<string | null> {
  const apiKey = process.env.REDUCTO_API_KEY;
  if (!apiKey) {
    console.warn('REDUCTO_API_KEY not configured, skipping document parsing');
    return null;
  }

  try {
    const client = new Reducto({ apiKey });

    const response = await client.parse.run({
      input: publicUrl,
      formatting: {
        table_output_format: 'md', // Markdown tables for LLM readability
      },
    });

    // Check if we got a sync response (has 'result' field) vs async response (only has 'job_id')
    if (!('result' in response)) {
      console.error('Reducto returned async response unexpectedly');
      return null;
    }

    const result = response.result;

    // Handle large responses that return a URL
    let chunks: Array<{ content: string }>;
    if (result.type === 'url') {
      const urlResult = result as { type: 'url'; url: string };
      const fetchResponse = await fetch(urlResult.url);
      chunks = await fetchResponse.json();
    } else if (result.type === 'full') {
      const fullResult = result as { type: 'full'; chunks: Array<{ content: string }> };
      chunks = fullResult.chunks;
    } else {
      return null;
    }

    // Combine all chunk content into a single markdown string
    const content = chunks
      .map((chunk) => chunk.content)
      .join('\n\n');

    return content || null;
  } catch (error) {
    console.error('Reducto parsing failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { agent } = authResult;
  const now = new Date();

  // Rate limit: max 10 uploads per hour (1 per 6 minutes)
  // Note: This check has a TOCTOU race condition where concurrent requests could
  // bypass the rate limit. For production, use findOneAndUpdate with a conditional
  // to atomically check and update lastUploadAt. Acceptable for current load.
  if (agent.lastUploadAt && (now.getTime() - new Date(agent.lastUploadAt).getTime()) < SIX_MINUTES) {
    return NextResponse.json(
      { error: 'Upload rate limit exceeded. Please wait before uploading again.' },
      { status: 429 }
    );
  }

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
    parsedContent = await parseWithReducto(publicUrl);
  }

  // Update lastUploadAt for rate limiting
  await Agent.updateOne({ _id: agent._id }, { lastUploadAt: now });

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
