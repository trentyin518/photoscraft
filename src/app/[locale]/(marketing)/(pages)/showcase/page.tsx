import { getApprovedCases } from '@/actions/showcase';
import { ShowcaseGrid } from '@/components/showcase/showcase-grid';
import { constructMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/server';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return constructMetadata({
    title: `${t('showcase')} | ${t('name')}`,
    description: t('showcaseDescription'),
    locale,
    pathname: '/showcase',
  });
}

/**
 * Public showcase (same tab as Editor): approved community creations.
 * Guests can browse; commenting requires login.
 */
export default async function ShowcasePage() {
  const session = await getSession();
  let cases: Awaited<ReturnType<typeof getApprovedCases>> = [];
  try {
    cases = await getApprovedCases();
  } catch (e) {
    console.error('showcase: failed to load approved cases', e);
  }

  return (
    <div className="container py-8">
      <ShowcaseGrid cases={cases} allowComment={!!session?.user} />
    </div>
  );
}
