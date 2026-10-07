import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import PricingSection from '@/components/blocks/pricing/pricing';
import { PhotoHomeHero, PhotoToolGrid } from '@/components/photocraft/home-tools';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

/**
 * PhotoCraft home: dark premium hero + tool grid (mirrors mobile app)
 * + pricing + FAQ + CTA. One clear action: pick a tool, upload.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '',
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage(_props: HomePageProps) {
  return (
    <>
      <div className="flex flex-col bg-[#07070d]">
        <PhotoHomeHero />
        <PhotoToolGrid />
        <PricingSection />
        <FaqSection />
        <CallToActionSection />
      </div>
    </>
  );
}
