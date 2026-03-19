import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { updateUserPlan } from '@/appwrite/updateUserPlan';
import { updateUserStripeInfo } from '@/appwrite/updateUserStripeInfo';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sessionId = searchParams.get('session_id');
  const userId = searchParams.get('user_id');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardUrl = `${appUrl}/auth/dashboard/${userId}`;

  if (!sessionId || !userId) {
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      (session.payment_status === 'paid' || session.status === 'complete') &&
      session.metadata?.userId === userId
    ) {
      const plan = session.metadata?.plan;
      if (plan) {
        await updateUserPlan(userId, plan);

        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

        if (customerId && subscriptionId) {
          await updateUserStripeInfo(userId, customerId, subscriptionId);
        }
      }
    }
  } catch (error) {
    console.error('Failed to confirm checkout session:', error);
  }

  return NextResponse.redirect(dashboardUrl);
}
