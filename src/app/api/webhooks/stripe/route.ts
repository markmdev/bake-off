import { constructWebhookEvent } from '@/lib/stripe';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

async function publishTask(session: Stripe.Checkout.Session): Promise<void> {
  const taskId = session.metadata?.taskId;

  if (!taskId) {
    console.error('No taskId in checkout session metadata');
    return;
  }

  await connectDB();
  const task = await Task.findById(taskId);

  if (!task) {
    console.error('Task not found:', taskId);
    return;
  }

  if (task.status !== 'draft') {
    console.log('Task already processed:', taskId, task.status);
    return;
  }

  // Transition draft → open
  task.status = 'open';
  task.publishedAt = new Date();
  task.stripeCheckoutSessionId = session.id;
  await task.save();

  console.log('Task published:', taskId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // For async payment methods, wait for async_payment_succeeded event
    if (session.payment_status !== 'paid') {
      console.log('Payment pending (async payment method):', session.payment_status);
      return NextResponse.json({ received: true });
    }

    await publishTask(session);
  } else if (event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    await publishTask(session);
  }

  return NextResponse.json({ received: true });
}
