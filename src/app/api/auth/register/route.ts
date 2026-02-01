import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { rateLimit, getClientId, authRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit registration attempts
  const clientId = getClientId(request);
  const rateLimitResult = rateLimit(`register:${clientId}`, authRateLimit);
  
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

  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await registerUser({ email, password, displayName });

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
