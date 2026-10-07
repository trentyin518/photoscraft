import * as Preview from '@/components/docs';
import { getMDXComponents } from '@/components/docs/mdx-components';
import { LLMCopyButton, ViewOptions } from '@/components/docs/page-actions';
import { LOCALES } from '@/i18n/routing';
import { constructMetadata } from '@/lib/metadata';
import { source } from '@/lib/source';
import { getMarkdownUrlWithLocale } from '@/lib/urls';
import { findNeighbour } from 'fumadocs-core/page-tree';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import type { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export function generateStaticParams() {
  const slugParams = source.generateParams();
  const params = LOCALES.flatMap((locale) =>
    slugParams.map((param) => ({
      locale,
      slug: param.slug,
    }))
  );

  return params;
}

export async function generateMetadata({ params }: DocPageProps) {
  const { slug, locale } = await params;
  const language = locale as string;
  const page = source.getPage(slug, language);
  if (!page) {
    console.warn('docs page not found', slug, language);
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: `${page.data.title} | ${t('title')}`,
    description: page.data.description,
    locale,
    pathname: page.slugs.length > 0 ? `/docs/${page.slugs.join('/')}` : '/docs',
  });
}

function PreviewRenderer({ preview }: { preview: string }): ReactNode {
  if (preview && preview in Preview) {
    const Comp = Preview[preview as keyof typeof Preview];
    return <Comp />;
  }

  return null;
}

export const revalidate = false;

interface DocPageProps {
  params: Promise<{
    slug?: string[];
    locale: Locale;
  }>;
}

/**
 * Doc Page
 *
 * ref:
 * https://github.com/fuma-nama/fumadocs/blob/dev/apps/docs/app/docs/%5B...slug%5D/page.tsx
 */
export default async function DocPage({ params }: DocPageProps) {
  const { slug, locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const language = locale as string;
  const page = source.getPage(slug, language);

  if (!page) {
    console.warn('docs page not found', slug, language);
    notFound();
  }

  const preview = page.data.preview;
  const MDX = page.data.body;

  // Build markdownUrl with locale prefix for LLM markdown endpoint
  // page.url might already include locale prefix (e.g., /zh/docs/comparisons)
  // or might not (e.g., /docs/what-is-fumadocs), so we need to normalize it
  const markdownUrl = getMarkdownUrlWithLocale(page.url, locale);
  const footerItems = findNeighbour(source.pageTree[locale], page.url);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      // Derive footer items on the server so production streaming and browser
      // hydration render the same previous/next links.
      footer={{ items: footerItems }}
      tableOfContent={{ style: 'clerk' }}
      // Fumadocs 16.12.1's active-heading mobile trigger is not hydration-safe
      // with Next.js 16.2 production streaming.
      tableOfContentPopover={{ enabled: false }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={markdownUrl} />
        <ViewOptions markdownUrl={markdownUrl} />
      </div>
      <DocsBody>
        {/* Preview Rendered Component */}
        {preview ? <PreviewRenderer preview={preview} /> : null}

        {/* MDX Content */}
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
