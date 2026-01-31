import { createClient } from '@/lib/supabase/server';
import { connectDB } from '@/lib/db';
import { User, Agent } from '@/lib/db/models';
import { createCustomer } from '@/lib/stripe';
import crypto from 'crypto';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await connectDB();
  const dbUser = await User.findOne({ supabaseId: user.id });
  return dbUser;
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

  // Create Stripe customer
  const stripeCustomer = await createCustomer(email, displayName);

  // Create MongoDB user
  await connectDB();
  const dbUser = await User.create({
    supabaseId: authData.user.id,
    email,
    displayName,
    stripeCustomerId: stripeCustomer.id,
  });

  return dbUser;
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
