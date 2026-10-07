import Container from '@/components/layout/container';
import { PHOTO_TOOLS } from '@/config/photo-tools';
import { websiteConfig } from '@/config/website';
import { constructMetadata } from '@/lib/metadata';
import { MailIcon } from 'lucide-react';
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
  const pt = await getTranslations({ locale, namespace: 'AboutPage' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: pt('description'),
    locale,
    pathname: '/about',
  });
}

export default async function AboutPage() {
  const t = await getTranslations('AboutPage');

  return (
    <Container className="px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-14">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6 text-center">
          <img
            src="/favicon.svg"
            alt="PhotoCraft logo"
            className="size-20 rounded-2xl"
          />
          <h1 className="text-4xl font-bold tracking-tight">{t('heading')}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t('mission')}
          </p>
          {websiteConfig.mail.supportEmail && (
            <a
              href={`mailto:${websiteConfig.mail.supportEmail}`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              <MailIcon className="size-4" />
              {websiteConfig.mail.supportEmail}
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border p-6">
            <p className="text-3xl font-bold">16</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('stats.tools')}
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="text-3xl font-bold">~15s</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('stats.speed')}
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="text-3xl font-bold">4.9★</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('stats.rating')}
            </p>
          </div>
        </div>

        {/* What we do */}
        <div>
          <h2 className="mb-6 text-center text-2xl font-bold">
            {t('toolsTitle')}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {PHOTO_TOOLS.map((tool) => (
              <a
                key={tool.id}
                href={`/editor?tool=${tool.id}`}
                className="rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-2 text-primary">{tool.icon}</div>
                <p className="text-sm font-semibold">{tool.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tool.tagline}
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="space-y-4 text-muted-foreground">
          <h2 className="text-center text-2xl font-bold text-foreground">
            {t('storyTitle')}
          </h2>
          <p>{t('story1')}</p>
          <p>{t('story2')}</p>
        </div>
      </div>
    </Container>
  );
}
