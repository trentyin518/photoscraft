'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

/**
 * PhotoCraft navbar: Editor + Features + Pricing only.
 * Legal pages live in footer for SEO. Everything else unlinked.
 */
export function useNavbarLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');

  return [
    { title: t('home.title'), href: Routes.Root, external: false },
    { title: t('editor.title'), href: Routes.Editor, external: false },
    { title: t('pricing.title'), href: Routes.Pricing, external: false },
  ];
}
