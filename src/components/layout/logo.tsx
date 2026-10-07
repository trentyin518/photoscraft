'use client';

import { cn } from '@/lib/utils';

/**
 * PhotoCraft logo: lucide-style aperture mark (inline SVG, theme-aware)
 * + wordmark.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 64 64" className="size-8 rounded-lg" aria-hidden="true">
        <defs>
          <linearGradient id="pc-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="0.55" stopColor="#D946EF" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill="url(#pc-logo-g)" />
        <g
          transform="translate(11,11) scale(1.75)"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m14.31 8 5.74 9.94" />
          <path d="M9.69 8h11.48" />
          <path d="m7.38 12 5.74-9.94" />
          <path d="M9.69 16 3.95 6.06" />
          <path d="M14.31 16H2.83" />
          <path d="m16.62 12-5.74 9.94" />
        </g>
        <path
          d="M50 8l1.6 3.9 3.9 1.6-3.9 1.6L50 19l-1.6-3.9-3.9-1.6 3.9-1.6z"
          fill="#fff"
        />
      </svg>
      <span className="text-lg font-bold tracking-tight">PhotoCraft</span>
    </span>
  );
}
