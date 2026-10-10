import localFont from 'next/font/local';

/**
 * Local fonts (self-hosted, no Google Fonts network request).
 * Files from Fontsource CDN (jsDelivr), latin subset, woff2.
 */

export const fontNotoSans = localFont({
  src: [
    { path: './noto-sans-500.woff2', weight: '500', style: 'normal' },
    { path: './noto-sans-600.woff2', weight: '600', style: 'normal' },
    { path: './noto-sans-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-noto-sans',
});

export const fontNotoSerif = localFont({
  src: [{ path: './noto-serif-400.woff2', weight: '400', style: 'normal' }],
  display: 'swap',
  variable: '--font-noto-serif',
});

export const fontNotoSansMono = localFont({
  src: [
    { path: './noto-sans-mono-400.woff2', weight: '400', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-noto-sans-mono',
});

export const fontBricolageGrotesque = localFont({
  src: [
    { path: './bricolage-400.woff2', weight: '400', style: 'normal' },
    { path: './bricolage-500.woff2', weight: '500', style: 'normal' },
    { path: './bricolage-600.woff2', weight: '600', style: 'normal' },
    { path: './bricolage-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-bricolage-grotesque',
});
