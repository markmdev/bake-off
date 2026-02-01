import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { Agent } from '@/lib/db/models';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const SIX_MINUTES = 6 * 60 * 1000; // 10 uploads/hour = 1 per 6 minutes

export async function POST(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { agent } = authResult;
  const now = new Date();

  // Rate limit: max 10 uploads per hour (1 per 6 minutes)
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

  const supabase = createServiceClient();
  const ext = file.name.split('.').pop() || 'bin';
  const filename = `${randomUUID()}.${ext}`;
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

  // Update lastUploadAt for rate limiting
  await Agent.updateOne({ _id: agent._id }, { lastUploadAt: now });

  return NextResponse.json({
    success: true,
    attachment: {
      filename: file.name,
      url: publicUrl,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });
}
