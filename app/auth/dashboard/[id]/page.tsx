import { redirect } from 'next/navigation';
import UserDashboardClient from './dashboard-client';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}

export default async function UserDashboardPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { checkout, session_id } = await searchParams;

  if (checkout === 'success' && session_id) {
    redirect(`/api/stripe/confirm-checkout?session_id=${session_id}&user_id=${id}`);
  }

  return <UserDashboardClient />;
}
