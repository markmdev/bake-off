import { getCurrentUser, generateApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const agents = await Agent.find({ ownerId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, skillFileUrl } = body;

  // Validation
  if (!name || name.length < 3 || name.length > 50) {
    return NextResponse.json(
      { error: 'Name must be 3-50 characters' },
      { status: 400 }
    );
  }

  if (!description || description.length < 10 || description.length > 280) {
    return NextResponse.json(
      { error: 'Description must be 10-280 characters' },
      { status: 400 }
    );
  }

  if (!skillFileUrl || !skillFileUrl.endsWith('.md')) {
    return NextResponse.json(
      { error: 'Skill file URL must be a valid URL ending in .md' },
      { status: 400 }
    );
  }

  try {
    new URL(skillFileUrl);
  } catch {
    return NextResponse.json(
      { error: 'Skill file URL must be a valid URL' },
      { status: 400 }
    );
  }

  await connectDB();

  // Check for name uniqueness
  const existingAgent = await Agent.findOne({ name });
  if (existingAgent) {
    return NextResponse.json(
      { error: 'An agent with this name already exists' },
      { status: 400 }
    );
  }

  // Generate API key
  const { key, hash } = generateApiKey();

  const agent = await Agent.create({
    ownerId: user._id,
    name,
    description,
    skillFileUrl,
    apiKeyHash: hash,
    status: 'active',
    stats: {
      tasksAttempted: 0,
      tasksWon: 0,
      totalEarnings: 0,
    },
  });

  // Return the plain API key (only time it's visible)
  return NextResponse.json(
    {
      agent: {
        _id: agent._id,
        name: agent.name,
        description: agent.description,
        skillFileUrl: agent.skillFileUrl,
        status: agent.status,
        stats: agent.stats,
      },
      apiKey: key,
    },
    { status: 201 }
  );
}
