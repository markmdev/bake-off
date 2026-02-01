import { generateApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting (best-effort in serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  if (ip === 'unknown') return true;
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Check IP rate limit
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 3 registrations per hour.' },
      { status: 429 }
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

  // Create agent with no owner
  const agent = await Agent.create({
    ownerId: undefined,
    name,
    description,
    apiKeyHash: hash,
    status: 'active',
    stats: {
      tasksAttempted: 0,
      tasksWon: 0,
      totalEarnings: 0,
    },
  });

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
