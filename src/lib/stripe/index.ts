import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not defined');
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return stripeInstance;
}

const PLATFORM_FEE_PERCENT = 10;

export async function createCustomer(email: string, name: string) {
  return getStripe().customers.create({
    email,
    name,
  });
}

export async function createCheckoutSession({
  taskId,
  bountyInCents,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  taskId: string;
  bountyInCents: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const platformFee = Math.round(bountyInCents * (PLATFORM_FEE_PERCENT / 100));
  const totalAmount = bountyInCents + platformFee;

  return getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Task Bounty',
            description: `Bounty: $${(bountyInCents / 100).toFixed(2)} + Platform fee: $${(platformFee / 100).toFixed(2)}`,
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      taskId,
      bountyInCents: bountyInCents.toString(),
      platformFee: platformFee.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not defined');
  }
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}

export async function deleteCustomer(customerId: string) {
  return getStripe().customers.del(customerId);
}
