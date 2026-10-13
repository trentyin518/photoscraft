'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  PHOTO_TOOLS,
  getPhotoToolText,
  type PhotoTool,
} from '@/config/photo-tools';
import type { photoJob } from '@/db/photocraft.schema';
import { deletePhotoJob, deletePhotoJobs } from '@/actions/delete-photo-job';
import { ShareCaseButton } from '@/components/showcase/share-case-button';
import { Routes } from '@/routes';
import { DownloadIcon, Loader2Icon, Trash2Icon } from 'lucide-react';
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
 * Layout per card: row1 title, row2 date, row3 actions left + credits right.
 */
export function MyPhotosGrid({ jobs }: { jobs: JobRow[] }) {
  const t = useTranslations('Dashboard.photos');
  const pt = useTranslations('PhotoTools');
  const ptr = pt as unknown as (key: string) => string;
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  const onDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeletingId(id);
    try {
      await (
        deletePhotoJob as unknown as (input: {
          id: string;
        }) => Promise<unknown>
      )({ id });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === jobs.length ? new Set() : new Set(jobs.map((j) => j.id))
    );

  const onBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(t('deleteBatchConfirm', { count: selected.size }))) return;
    setBatchDeleting(true);
    try {
      await (
        deletePhotoJobs as unknown as (input: {
          ids: string[];
        }) => Promise<unknown>
      )({ ids: [...selected] });
      setSelected(new Set());
      router.refresh();
    } finally {
      setBatchDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Checkbox
          checked={jobs.length > 0 && selected.size === jobs.length}
          onCheckedChange={toggleAll}
          aria-label={t('selectAll')}
        />
        <span className="text-sm text-muted-foreground">
          {selected.size > 0
            ? t('selectedCount', { count: selected.size })
            : t('selectHint')}
        </span>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="destructive"
            disabled={selected.size === 0 || batchDeleting}
            onClick={() => void onBatchDelete()}
          >
            {batchDeleting ? (
              <Loader2Icon className="mr-1 size-4 animate-spin" />
            ) : (
              <Trash2Icon className="mr-1 size-4" />
            )}
            {t('deleteSelected', { count: selected.size })}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {jobs.map((job) => {
          const tool = toolById.get(job.tool);
          const name = tool ? getPhotoToolText(tool, ptr).title : job.tool;
          const preview = job.outputUrl ?? job.inputUrl;
          const busy = job.status === 'pending' || job.status === 'processing';
          const checked = selected.has(job.id);

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
                <span className="absolute left-2 top-2 flex gap-2">
                  <Badge
                    variant={
                      job.status === 'failed' ? 'destructive' : 'secondary'
                    }
                  >
                    {busy && <Loader2Icon className="mr-1 size-3 animate-spin" />}
                    {t(`status.${job.status}`)}
                  </Badge>
                </span>
                <span className="absolute right-2 top-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOne(job.id)}
                    aria-label={t('select')}
                    className="bg-white shadow"
                  />
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {job.createdAt
                    ? new Date(job.createdAt).toLocaleString()
                    : ''}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <div className="flex items-center gap-1">
                    {job.outputUrl && (
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                        title={t('download')}
                      >
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
                    <ShareCaseButton photoJobId={job.id} disabled={!job.outputUrl} />
                    <Button
                      size="icon"
                      variant="ghost"
                      title={t('delete')}
                      disabled={deletingId === job.id}
                      onClick={() => void onDelete(job.id)}
                    >
                      {deletingId === job.id ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        href={`${Routes.Editor}?tool=${job.tool}&image=${encodeURIComponent(job.inputUrl)}`}
                      >
                        {t('openEditor')}
                      </Link>
                    </Button>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {t('creditsUsed', { count: job.costCredits })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
