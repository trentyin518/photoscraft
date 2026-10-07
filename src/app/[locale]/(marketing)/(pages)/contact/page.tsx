import { ContactFormCard } from '@/components/contact/contact-form-card';
import Container from '@/components/layout/container';
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
  const pt = await getTranslations({ locale, namespace: 'ContactPage' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: pt('description'),
    locale,
    pathname: '/contact',
  });
}

export default async function ContactPage() {
  const t = await getTranslations('ContactPage');

  return (
    <Container className="px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-8 pb-16">
        <div className="space-y-4">
          <h1 className="text-center text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-center text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
          {websiteConfig.mail.supportEmail && (
            <p className="text-center text-sm text-muted-foreground">
              {t('directHint')}{' '}
              <a
                href={`mailto:${websiteConfig.mail.supportEmail}`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <MailIcon className="size-3.5" />
                {websiteConfig.mail.supportEmail}
              </a>
            </p>
          )}
        </div>

        <ContactFormCard />
      </div>
    </Container>
  );
}
