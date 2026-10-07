'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, UploadIcon, ZapIcon } from 'lucide-react';
import { PHOTO_TOOLS, PHOTO_TOOL_CATEGORIES } from '@/config/photo-tools';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Premium dark hero: one headline, one upload CTA, trust row. */
export function PhotoHomeHero() {
  return (
    <section className="relative overflow-hidden bg-[#07070d] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[140px]" />
        <div className="absolute top-40 -left-40 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
        <div className="absolute top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-20 pb-14 text-center md:pt-28">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/80">
          <ZapIcon className="size-3.5 text-amber-300" />
          16 AI tools · No signup to try · Results in seconds
        </div>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Every photo fix,
          <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            {' '}
            one click away
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/60 md:text-lg">
          Enhance, restore, colorize, erase, cut out backgrounds or turn photos
          into anime — pick a tool below and upload.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/editor?tool=enhance">
            <Button
              size="lg"
              className="gap-2 rounded-full bg-white px-8 text-black hover:bg-white/90"
            >
              <UploadIcon className="size-4" /> Upload a photo
            </Button>
          </Link>
          <Link href="#tools">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-full border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
            >
              Browse tools <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex items-center gap-6 text-xs text-white/40">
          <span>★ 4.9 · 2M+ photos enhanced</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            Free preview · Pay only to download
          </span>
        </div>
      </div>
    </section>
  );
}

/** Category-filtered tool grid, mirrors the mobile app cards. */
export function PhotoToolGrid() {
  const [cat, setCat] = useState<string>('All');
  const cats = ['All', ...PHOTO_TOOL_CATEGORIES];
  const tools =
    cat === 'All' ? PHOTO_TOOLS : PHOTO_TOOLS.filter((t) => t.category === cat);

  return (
    <section id="tools" className="bg-[#07070d] pb-20 text-white">
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
                  ? 'bg-white font-medium text-black'
                  : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tools.map((t) => (
            <Link
              key={t.id}
              href={`/editor?tool=${t.id}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.4)]"
            >
              <div
                className={cn(
                  'relative flex h-36 items-center justify-center bg-gradient-to-br md:h-44',
                  t.gradient
                )}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-black/35 text-white backdrop-blur transition group-hover:scale-110">
                  {t.icon}
                </span>
                {t.hot && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 backdrop-blur">
                    HOT
                  </span>
                )}
                <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] text-white/80 backdrop-blur">
                  {t.cost} credit{t.cost > 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold md:text-[15px]">
                  {t.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-white/50">
                  {t.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-white/40">
          Three steps: pick a tool → upload → download. No learning curve.
        </p>
      </div>
    </section>
  );
}
