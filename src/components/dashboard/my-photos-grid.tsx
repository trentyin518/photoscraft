'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PHOTO_TOOLS,
  getPhotoToolText,
  type PhotoTool,
} from '@/config/photo-tools';
import type { photoJob } from '@/db/photocraft.schema';
import { Routes } from '@/routes';
import { DownloadIcon, Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type JobRow = Pick<
  typeof photoJob.$inferSelect,
  | 'id'
  | 'tool'
  | 'inputUrl'
  | 'outputUrl'
  | 'status'
  | 'costCredits'
  | 'createdAt'
>;

const toolById = new Map<string, PhotoTool>(
  PHOTO_TOOLS.map((tool) => [tool.id, tool])
);

/**
 * Grid of the user's photo jobs with translated tool names.
 */
export function MyPhotosGrid({ jobs }: { jobs: JobRow[] }) {
  const t = useTranslations('Dashboard.photos');
  const pt = useTranslations('PhotoTools');
  const ptr = pt as unknown as (key: string) => string;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {jobs.map((job) => {
        const tool = toolById.get(job.tool);
        const name = tool
          ? getPhotoToolText(tool, ptr).title
          : job.tool;
        const preview = job.outputUrl ?? job.inputUrl;
        const busy = job.status === 'pending' || job.status === 'processing';

        return (
          <div
            key={job.id}
            className="group overflow-hidden rounded-xl border bg-card"
          >
            <div className="relative aspect-square bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={name}
                loading="lazy"
                className="size-full object-cover"
              />
              <span className="absolute left-2 top-2">
                <Badge
                  variant={job.status === 'failed' ? 'destructive' : 'secondary'}
                >
                  {busy && (
                    <Loader2Icon className="mr-1 size-3 animate-spin" />
                  )}
                  {t(`status.${job.status}`)}
                </Badge>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {job.createdAt
                    ? new Date(job.createdAt).toLocaleDateString()
                    : ''}
                  {' · '}
                  {t('creditsUsed', { count: job.costCredits })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {job.outputUrl && (
                  <Button size="icon" variant="ghost" asChild title={t('download')}>
                    <a
                      href={job.outputUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <DownloadIcon className="size-4" />
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`${Routes.Editor}?tool=${job.tool}`}>
                    {t('openEditor')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
