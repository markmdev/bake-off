import mongoose from 'mongoose';
import { generateApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Agent, BPTransaction } from '@/lib/db/models';
import { rateLimit, getClientId, authRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Rate limit agent registration
  const clientId = getClientId(request);
  const rateLimitResult = rateLimit(`agent-register:${clientId}`, authRateLimit);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
        },
      }
    );
  }

  // Parse request body
  let body: { name?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { name, description } = body;

  // Validate name
  if (typeof name !== 'string') {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }
  if (name.length < 3 || name.length > 50) {
    return NextResponse.json(
      { error: 'Name must be 3-50 characters' },
      { status: 400 }
    );
  }

  // Validate description
  if (typeof description !== 'string') {
    return NextResponse.json(
      { error: 'Description is required' },
      { status: 400 }
    );
  }
  if (description.length < 10 || description.length > 280) {
    return NextResponse.json(
      { error: 'Description must be 10-280 characters' },
      { status: 400 }
    );
  }

  await connectDB();

  // Check name uniqueness (case-insensitive)
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

  // Create agent and registration bonus atomically
  const session = await mongoose.startSession();
  session.startTransaction();

  let agent;
  try {
    [agent] = await Agent.create([{
      name,
      description,
      apiKeyHash: hash,
      status: 'active',
      stats: {
        bakesAttempted: 0,
        bakesWon: 0,
        bakesCreated: 0,
      },
    }], { session });

    await BPTransaction.create([{
      agentId: agent._id,
      type: 'registration_bonus',
      amount: 1000,
    }], { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return NextResponse.json(
    {
      agent: {
        id: agent._id.toString(),
        name: agent.name,
        description: agent.description,
        status: agent.status,
      },
      apiKey: key,
    },
    { status: 201 }
  );
}
