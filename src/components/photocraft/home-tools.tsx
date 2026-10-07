'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, UploadIcon, ZapIcon } from 'lucide-react';
import {
  PHOTO_TOOLS,
  PHOTO_TOOL_CATEGORIES,
  PHOTO_TOOL_CATEGORY_KEYS,
  getPhotoToolText,
} from '@/config/photo-tools';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Premium hero: light gradient in light mode, dark glow in dark mode. */
export function PhotoHomeHero() {
  const t = useTranslations('PhotoTools');
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-violet-100 via-fuchsia-50 to-background text-gray-900 dark:bg-[#07070d] dark:bg-none dark:text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-violet-400/30 blur-[140px] dark:bg-violet-600/25" />
        <div className="absolute top-40 -left-40 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-[120px] dark:bg-fuchsia-600/15" />
        <div className="absolute top-40 -right-40 h-96 w-96 rounded-full bg-cyan-300/30 blur-[120px] dark:bg-cyan-500/15" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-20 pb-14 text-center md:pt-28">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs text-gray-600 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
          <ZapIcon className="size-3.5 text-amber-500 dark:text-amber-300" />
          {t('hero.badge')}
        </div>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          {t('hero.titleA')}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-cyan-300">
            {' '}
            {t('hero.titleB')}
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-gray-600 md:text-lg dark:text-white/60">
          {t('hero.subtitle')}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/editor?tool=enhance">
            <Button
              size="lg"
              className="gap-2 rounded-full bg-gray-900 px-8 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <UploadIcon className="size-4" /> {t('hero.upload')}
            </Button>
          </Link>
          <Link href="#tools">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-full border-gray-300 bg-transparent px-8 text-gray-900 hover:bg-gray-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              {t('hero.browse')} <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex items-center gap-6 text-xs text-gray-500 dark:text-white/40">
          <span>{t('hero.trust')}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            {t('hero.freePreview')}
          </span>
        </div>
      </div>
    </section>
  );
}

/** Category-filtered tool grid, mirrors the mobile app cards. */
export function PhotoToolGrid() {
  const t = useTranslations('PhotoTools');
  const tr = t as unknown as (key: string) => string;
  const [cat, setCat] = useState<string>('All');
  const cats = ['All', ...PHOTO_TOOL_CATEGORIES];
  const tools =
    cat === 'All' ? PHOTO_TOOLS : PHOTO_TOOLS.filter((t) => t.category === cat);

  return (
    <section
      id="tools"
      className="bg-background pb-20 text-gray-900 dark:bg-[#07070d] dark:text-white"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {cats.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'rounded-full px-5 py-2 text-sm transition',
                cat === c
                  ? 'bg-gray-900 font-medium text-white dark:bg-white dark:text-black'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10',
              )}
            >
              {c === 'All'
                ? t('categories.all')
                : t(
                    `categories.${PHOTO_TOOL_CATEGORY_KEYS[c as keyof typeof PHOTO_TOOL_CATEGORY_KEYS]}`
                  )}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tools.map((tool) => {
            const text = getPhotoToolText(tool, tr);
            return (
            <Link
              key={tool.id}
              href={`/editor?tool=${tool.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.35)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/25 dark:hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.4)]"
            >
              <div
                className={cn(
                  'relative flex h-36 items-center justify-center bg-gradient-to-br md:h-44',
                  tool.gradient,
                )}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-black/35 text-white backdrop-blur transition group-hover:scale-110">
                  {tool.icon}
                </span>
                {tool.hot && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 backdrop-blur">
                    {t('hero.hot')}
                  </span>
                )}
                <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] text-white/80 backdrop-blur">
                  {tool.cost} {t('hero.credits.other')}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold md:text-[15px]">{text.title}</p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-white/50">
                  {text.tagline}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
        <p className="mt-10 text-center text-sm text-gray-500 dark:text-white/40">
          {t('hero.steps')}
        </p>
      </div>
    </section>
  );
}
