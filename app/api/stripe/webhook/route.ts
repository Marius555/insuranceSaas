import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { updateUserPlan } from '@/appwrite/updateUserPlan';
import { updateUserStripeInfo, clearUserStripeSubscription } from '@/appwrite/updateUserStripeInfo';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId || !plan) {
          console.error('Missing userId or plan in checkout session metadata', session.id);
          break;
        }

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (customerId && subscriptionId) {
          await Promise.all([
            updateUserPlan(userId, plan),
            updateUserStripeInfo(userId, customerId, subscriptionId),
          ]);
        } else {
          await updateUserPlan(userId, plan);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata', subscription.id);
          break;
        }

        await Promise.all([
          updateUserPlan(userId, 'free'),
          clearUserStripeSubscription(userId),
        ]);
        break;
      }

      default:
        break;
    }
  } catch (err: unknown) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    return NextResponse.json({ error: 'Internal error processing webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
