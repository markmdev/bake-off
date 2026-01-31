import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST endpoint for cleanup - supports sendBeacon which only does POST
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

  let urls: unknown;
  try {
    const body = await request.json();
    urls = body.urls;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ deleted: 0 });
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
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete files' },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: filePaths.length });
}
