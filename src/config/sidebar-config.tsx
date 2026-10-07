'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import {
  CircleUserRoundIcon,
  CreditCardIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LockKeyholeIcon,
  Settings2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * PhotoCraft sidebar: My Photos + Editor + Settings(profile/billing/security).
 * API keys / notifications / admin kept only if enabled.
 */
export function useSidebarLinks(): NestedMenuItem[] {
  const t = useTranslations('Dashboard');

  return [
    {
      title: t('dashboard.title'),
      icon: <LayoutDashboardIcon className="size-4 shrink-0" />,
      href: Routes.Dashboard,
      external: false,
    },
    {
      title: t('editor.title'),
      icon: <ImageIcon className="size-4 shrink-0" />,
      href: Routes.Editor,
      external: false,
    },
    {
      title: t('settings.title'),
      icon: <Settings2Icon className="size-4 shrink-0" />,
      items: [
        {
          title: t('settings.profile.title'),
          icon: <CircleUserRoundIcon className="size-4 shrink-0" />,
          href: Routes.SettingsProfile,
          external: false,
        },
        {
          title: t('settings.billing.title'),
          icon: <CreditCardIcon className="size-4 shrink-0" />,
          href: Routes.SettingsBilling,
          external: false,
        },
        {
          title: t('settings.security.title'),
          icon: <LockKeyholeIcon className="size-4 shrink-0" />,
          href: Routes.SettingsSecurity,
          external: false,
        },
      ],
    },
  ];
}
