import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const PLATFORM_FEE_PERCENT = 10;

export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({
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

  return stripe.checkout.sessions.create({
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
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
