import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MyPhotosGrid } from '@/components/dashboard/my-photos-grid';
import { MyPhotosEmpty } from '@/components/dashboard/my-photos-empty';
import { getDb } from '@/db';
import { photoJob } from '@/db/photocraft.schema';
import { getSession } from '@/lib/server';
import { Routes } from '@/routes';
import { desc, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

/**
 * My Photos — the user's own AI creations.
 *
 * Replaces the template demo dashboard (fake charts/tables).
 * Admin-only views live under /admin/* and are role-guarded there.
 */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect(Routes.Login);
  }

  const t = await getTranslations('Dashboard');

  const db = await getDb();
  const jobs = await db
    .select({
      id: photoJob.id,
      tool: photoJob.tool,
      inputUrl: photoJob.inputUrl,
      outputUrl: photoJob.outputUrl,
      status: photoJob.status,
      costCredits: photoJob.costCredits,
      createdAt: photoJob.createdAt,
    })
    .from(photoJob)
    .where(eq(photoJob.userId, session.user.id))
    .orderBy(desc(photoJob.createdAt))
    .limit(60);

  const breadcrumbs = [
    {
      label: t('dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t('dashboard.title')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('photos.subtitle')}
              </p>
            </div>

            {jobs.length === 0 ? (
              <MyPhotosEmpty />
            ) : (
              <MyPhotosGrid jobs={jobs} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
