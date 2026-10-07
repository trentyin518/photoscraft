'use client';

import { websiteConfig } from '@/config/website';
import type { Translations } from 'fumadocs-ui/i18n';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Wraps Fumadocs RootProvider (Shiki, MDX components context).
 * Only used in docs, blog post, and legal layouts so fumadocs-ui is not loaded on other pages.
 */
export function DocsRootProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) ?? websiteConfig.i18n.defaultLocale;

  const locales = Object.entries(websiteConfig.i18n.locales).map(
    ([loc, data]) => ({
      name: data.name,
      locale: loc,
    })
  );

  const t = useTranslations('DocsPage');
  const translations: Partial<Translations> = {
    'On this page(table of contents)': t('toc'),
    'Search(search dialog)': t('search'),
    'Search(search trigger)': t('search'),
    'Last updated on(page footer)': t('lastUpdate'),
    'No results found(search dialog)': t('searchNoResult'),
    'Previous Page(pagination)': t('previousPage'),
    'Next Page(pagination)': t('nextPage'),
    'Choose a language(language switcher)': t('chooseLanguage'),
    'Choose a language(language switcher)(aria-label)': t('chooseLanguage'),
  };

  return (
    <RootProvider
      theme={{ enabled: false }}
      i18n={{ locale, locales, translations }}
    >
      {children}
    </RootProvider>
  );
}
