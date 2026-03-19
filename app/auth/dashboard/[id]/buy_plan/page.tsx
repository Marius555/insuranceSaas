import { redirect } from 'next/navigation';
import { getSession } from '@/appwrite/getSession';
import { createCheckoutSession } from '@/lib/stripe/createCheckoutSession';

interface BuyPlanPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ plan?: string }>;
}

const VALID_PLANS = ['pro', 'max'];

export default async function BuyPlanPage({ params, searchParams }: BuyPlanPageProps) {
  const { id: userId } = await params;
  const { plan } = await searchParams;

  if (!plan || !VALID_PLANS.includes(plan)) {
    redirect('/pricing');
  }

  const session = await getSession();
  const userEmail = session?.email ?? '';

  const result = await createCheckoutSession(userId, plan, userEmail);

  if (!result.success) {
    console.error('Checkout session error:', result.message);
    redirect('/pricing?error=checkout_failed');
  }

  redirect(result.url);
}
