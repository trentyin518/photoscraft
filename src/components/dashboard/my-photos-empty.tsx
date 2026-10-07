'use client';

import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import { ImagePlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

/**
 * Empty state for My Photos — guides new users to the editor.
 */
export function MyPhotosEmpty() {
  const t = useTranslations('Dashboard.photos');

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <ImagePlusIcon className="size-6 text-muted-foreground" />
      </span>
      <div>
        <p className="text-lg font-semibold">{t('emptyTitle')}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t('emptyDesc')}
        </p>
      </div>
      <Link href={Routes.Editor}>
        <Button size="lg">{t('cta')}</Button>
      </Link>
    </div>
  );
}
