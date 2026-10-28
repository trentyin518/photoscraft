'use client';

import { AI_MODEL_CATALOG } from '@/config/ai-models';
import { LocaleLink } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface AiModelsDisclosureProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function AiModelsDisclosure({
  variant = 'full',
  className,
}: AiModelsDisclosureProps) {
  const t = useTranslations('AiModels');

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-xl border bg-muted/30 px-5 py-4 text-sm',
          className
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="font-semibold">{t('compactTitle')}</p>
          <p className="text-muted-foreground">{t('compactDescription')}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {AI_MODEL_CATALOG.map((model) => (
            <span
              key={model.id}
              className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium"
            >
              {model.name}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t('note')}{' '}
          <LocaleLink
            href={Routes.AIGCPolicy}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {t('policyLink')}
          </LocaleLink>
        </p>
      </div>
    );
  }

  return (
    <section className={cn('space-y-6', className)}>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {AI_MODEL_CATALOG.map((model) => (
          <div key={model.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{model.name}</p>
              <span className="text-xs text-muted-foreground">
                {model.provider}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`roles.${model.role}`)}
            </p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {t('note')}{' '}
        <LocaleLink
          href={Routes.AIGCPolicy}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {t('policyLink')}
        </LocaleLink>
      </p>
    </section>
  );
}
