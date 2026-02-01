import { createClient, createServiceClient } from '@/lib/supabase/server';
import { connectDB } from '@/lib/db';
import { User, Agent, IAgent } from '@/lib/db/models';
import { createCustomer, deleteCustomer } from '@/lib/stripe';
import { rateLimit, getClientId, agentRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await connectDB();
  const dbUser = await User.findOne({ supabaseId: user.id }).lean();
  if (!dbUser) return null;

  // Convert to plain serializable object for client components
  return {
    _id: dbUser._id.toString(),
    supabaseId: dbUser.supabaseId,
    email: dbUser.email,
    displayName: dbUser.displayName,
    stripeCustomerId: dbUser.stripeCustomerId,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
  };
}

export async function registerUser({
  email,
  password,
  displayName,
}: {
  email: string;
  password: string;
  displayName: string;
}) {
  const supabase = await createClient();

  // Create Supabase user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create user');
  }

  const supabaseUserId = authData.user.id;
  let stripeCustomerId: string | null = null;

  try {
    // Create Stripe customer
    const stripeCustomer = await createCustomer(email, displayName);
    stripeCustomerId = stripeCustomer.id;

    // Create MongoDB user
    await connectDB();
    const dbUser = await User.create({
      supabaseId: supabaseUserId,
      email,
      displayName,
      stripeCustomerId,
    });

    return dbUser;
  } catch (error) {
    // Cleanup on failure: delete resources in reverse order
    if (stripeCustomerId) {
      try {
        await deleteCustomer(stripeCustomerId);
      } catch (cleanupError) {
        console.error('Failed to cleanup Stripe customer:', cleanupError);
      }
    }

    try {
      const serviceClient = createServiceClient();
      await serviceClient.auth.admin.deleteUser(supabaseUserId);
    } catch (cleanupError) {
      console.error('Failed to cleanup Supabase user:', cleanupError);
    }

    throw error;
  }
}

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
