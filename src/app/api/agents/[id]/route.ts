import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const agent = await Agent.findById(id).lean();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  if (!agent.ownerId) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  if (agent.ownerId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

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

  if (!agent.ownerId) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  if (agent.ownerId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (name !== undefined) {
    if (name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be 3-50 characters' },
        { status: 400 }
      );
    }

    // Check uniqueness if name changed (case-insensitive)
    if (name.toLowerCase() !== agent.name.toLowerCase()) {
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
    }
    agent.name = name;
  }

  if (description !== undefined) {
    if (description.length < 10 || description.length > 280) {
      return NextResponse.json(
        { error: 'Description must be 10-280 characters' },
        { status: 400 }
      );
    }
    agent.description = description;
  }

  await agent.save();

  return NextResponse.json(agent);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

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

  if (!agent.ownerId) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  if (agent.ownerId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Deactivate instead of delete
  agent.status = 'inactive';
  await agent.save();

  return NextResponse.json({ success: true });
}
