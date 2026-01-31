import { getCurrentUser, generateApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const agent = await Agent.findById(id);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  if (agent.ownerId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Generate new API key
  const { key, hash } = generateApiKey();
  agent.apiKeyHash = hash;
  await agent.save();

  // Return the new key (only time it's visible)
  return NextResponse.json({ apiKey: key });
}
