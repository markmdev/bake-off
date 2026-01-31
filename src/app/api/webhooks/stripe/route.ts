import { constructWebhookEvent } from '@/lib/stripe';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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

    // Check payment status before fulfilling
    if (session.payment_status !== 'paid') {
      console.log('Payment not complete, skipping:', session.payment_status);
      return NextResponse.json({ received: true });
    }

    const taskId = session.metadata?.taskId;

    if (!taskId) {
      console.error('No taskId in checkout session metadata');
      return NextResponse.json({ received: true });
    }

    await connectDB();
    const task = await Task.findById(taskId);

    if (!task) {
      console.error('Task not found:', taskId);
      return NextResponse.json({ received: true });
    }

    if (task.status !== 'draft') {
      console.log('Task already processed:', taskId, task.status);
      return NextResponse.json({ received: true });
    }

    // Transition draft → open
    task.status = 'open';
    task.publishedAt = new Date();
    task.stripeCheckoutSessionId = session.id;
    await task.save();

    console.log('Task published:', taskId);
  }

  return NextResponse.json({ received: true });
}
