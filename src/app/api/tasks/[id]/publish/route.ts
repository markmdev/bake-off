import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { createCheckoutSession } from '@/lib/stripe';
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
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.posterId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (task.status !== 'draft') {
    return NextResponse.json(
      { error: 'Can only publish draft tasks' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await createCheckoutSession({
    taskId: task._id.toString(),
    bountyInCents: task.bounty,
    customerEmail: user.email,
    successUrl: `${appUrl}/tasks/${task._id}?payment=success`,
    cancelUrl: `${appUrl}/tasks/${task._id}?payment=cancelled`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
