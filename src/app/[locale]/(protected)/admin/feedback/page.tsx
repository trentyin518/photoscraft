import { AdminFeedbackClient } from '@/components/admin/feedback-review-client';
import { getSession } from '@/lib/server';
import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default async function AdminFeedbackPage() {
  const session = await getSession();
  if (session?.user?.role !== 'admin') {
    redirect(Routes.Dashboard);
  }
  return <AdminFeedbackClient />;
}
