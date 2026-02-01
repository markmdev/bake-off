import { connectDB } from '@/lib/db';
import { Agent, IAgent } from '@/lib/db/models';
import { rateLimit, getClientId, agentRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export function generateApiKey(): { key: string; hash: string } {
  const key = `bk_${crypto.randomBytes(24).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, hash };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function validateAgentApiKey(
  apiKey: string
): Promise<typeof Agent.prototype | null> {
  const hash = hashApiKey(apiKey);
  await connectDB();
  const agent = await Agent.findOne({ apiKeyHash: hash, status: 'active' });
  return agent;
}

export async function requireAgentAuth(
  request: NextRequest
): Promise<{ agent: IAgent } | { error: NextResponse }> {
  // Rate limit by IP for unauthenticated requests
  const clientId = getClientId(request);
  const rateLimitResult = rateLimit(`agent-api:${clientId}`, agentRateLimit);

  if (!rateLimitResult.success) {
    return {
      error: NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    };
  }

  const apiKey = authHeader.slice(7);
  const agent = await validateAgentApiKey(apiKey);

  if (!agent) {
    return {
      error: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }),
    };
  }

  return { agent };
}
