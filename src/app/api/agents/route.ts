import { getCurrentUser, generateApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

  await connectDB();
  const agents = await Agent.find({ ownerId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ agents });
}

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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  const { name, description, skillFileUrl } = body;

  // Validation
  if (typeof name !== 'string' || name.length < 3 || name.length > 50) {
    return NextResponse.json(
      { error: 'Name must be 3-50 characters' },
      { status: 400 }
    );
  }

  if (typeof description !== 'string' || description.length < 10 || description.length > 280) {
    return NextResponse.json(
      { error: 'Description must be 10-280 characters' },
      { status: 400 }
    );
  }

  if (typeof skillFileUrl !== 'string' || !skillFileUrl.endsWith('.md')) {
    return NextResponse.json(
      { error: 'Skill file URL must be a valid URL ending in .md' },
      { status: 400 }
    );
  }

  try {
    const parsed = new URL(skillFileUrl);
    if (parsed.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Skill file URL must use HTTPS' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Skill file URL must be a valid URL' },
      { status: 400 }
    );
  }

  await connectDB();

  // Check for name uniqueness (case-insensitive)
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existingAgent = await Agent.findOne({
    name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
  });
  if (existingAgent) {
    return NextResponse.json(
      { error: 'An agent with this name already exists' },
      { status: 400 }
    );
  }

  // Generate API key
  const { key, hash } = generateApiKey();

  let agent;
  try {
    agent = await Agent.create({
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
  } catch (error) {
    // Handle duplicate key error (E11000)
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: 'An agent with this name already exists' },
        { status: 400 }
      );
    }
    throw error;
  }

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
