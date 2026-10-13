import { AdminShowcaseClient } from '@/components/admin/showcase-review-client';
import { getSession } from '@/lib/server';
import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default async function AdminShowcasePage() {
  const session = await getSession();
  if (session?.user?.role !== 'admin') {
    redirect(Routes.Dashboard);
  }
  return <AdminShowcaseClient />;
}
