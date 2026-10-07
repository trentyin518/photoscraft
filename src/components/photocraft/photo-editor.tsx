'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { usePhotoEditorStore } from '@/stores/photo-editor-store';
import { createPhotoJob } from '@/actions/create-photo-job';
import { getCreditBalanceAction } from '@/actions/get-credit-balance';
import { PHOTO_TOOLS, getPhotoToolText } from '@/config/photo-tools';
import { useTranslations } from 'next-intl';
import type { PhotoToolType } from '@/db/photocraft.schema';
import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

async function pollJob(jobId: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`/api/jobs/${jobId}`);
    const j = (await res.json()) as { status: string; outputUrl?: string };
    if (j.status === 'done' && j.outputUrl) return j.outputUrl;
    if (j.status === 'failed') throw new Error('JOB_FAILED');
  }
  throw new Error('JOB_TIMEOUT');
}

export function PhotoEditor({
  initialTool = 'enhance' as PhotoToolType,
}: {
  initialTool?: PhotoToolType;
}) {
  const { tool, inputUrl, outputUrl, status, params, set } =
    usePhotoEditorStore();
  const t = useTranslations('PhotoTools');
  const tr = t as unknown as (key: string) => string;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const refreshBalance = async () => {
    try {
      const r = (await getCreditBalanceAction({})) as unknown as {
        data?: { balance: number };
      };
      if (typeof r?.data?.balance === 'number') setBalance(r.data.balance);
    } catch {
      // balance display is best-effort; job creation still validates server-side
    }
  };

  useEffect(() => {
    void refreshBalance();
  }, []);

  useEffect(() => {
    set({ tool: initialTool });
  }, [initialTool, set]);
  const current = PHOTO_TOOLS.find((item) => item.id === tool) ?? PHOTO_TOOLS[0];
  const currentText = getPhotoToolText(current, tr);

  const onFile = async (f: File) => {
    setErr(null);
    set({ status: 'uploading', outputUrl: null });
    const fd = new FormData();
    fd.append('file', f);
    fd.append('folder', 'photocraft');
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      set({ status: 'idle' });
      setErr('Upload failed — check storage config or sign in');
      return;
    }
    const j = (await res.json()) as { url: string };
    set({ inputUrl: j.url, status: 'idle' });
  };

  const run = async () => {
    if (!inputUrl) return;
    setBusy(true);
    setErr(null);
    set({ status: 'processing', outputUrl: null });
    try {
      const runAction = createPhotoJob as unknown as (input: {
        tool: typeof tool;
        inputUrl: string;
        params: Record<string, unknown>;
      }) => Promise<{ data?: { jobId: string } }>;
      const r = await runAction({ tool, inputUrl, params });
      const jobId = r?.data?.jobId;
      if (!jobId) throw new Error('Failed to create job');
      set({ jobId });
      const url = await pollJob(jobId);
      set({ outputUrl: url, status: 'done' });
    } catch (e) {
      set({ status: 'failed' });
      const message = e instanceof Error ? e.message : 'Processing failed';
      setErr(
        message.includes('INSUFFICIENT_CREDITS')
          ? `${t('editor.insufficient')} — ${t('editor.topup')}`
          : message
      );
    } finally {
      setBusy(false);
      void refreshBalance();
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> All tools
        </Link>
        <Select
          value={tool}
          onValueChange={(v) =>
            set({ tool: v as PhotoToolType, outputUrl: null, status: 'idle' })
          }
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHOTO_TOOLS.map((item) => {
              const text = getPhotoToolText(item, tr);
              return (
                <SelectItem key={item.id} value={item.id}>
                  {text.title} · {item.cost} {t('hero.credits.other')}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border p-4 min-h-105 flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold">{currentText.title}</h1>
            <p className="text-sm text-muted-foreground">{currentText.tagline}</p>
          </div>
          <label className="flex h-56 cursor-pointer items-center justify-center rounded-lg border-dashed border-2 text-sm text-muted-foreground overflow-hidden">
            {inputUrl ? (
              <img src={inputUrl} alt="" className="h-full object-contain" />
            ) : (
              t('hero.uploadHint')
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>
          {inputUrl && outputUrl && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs mb-1">{t('hero.before')}</p>
                <img src={inputUrl} alt="before" className="rounded" />
              </div>
              <div>
                <p className="text-xs mb-1">{t('hero.after')}</p>
                <img src={outputUrl} alt="after" className="rounded" />
              </div>
            </div>
          )}
          {status === 'uploading' && <p className="text-sm">Uploading…</p>}
          {status === 'processing' && (
            <p className="text-sm animate-pulse">
              AI processing… ~10-30s, keep this page open
            </p>
          )}
          {err && <p className="text-sm text-red-500">{err}</p>}
        </div>
        <div className="rounded-xl border p-4 flex flex-col gap-4 h-fit">
          {(tool === 'enhance' || tool === 'restore') && (
            <div>
              <p className="text-sm mb-2">
                Strength {(params.strength as number) ?? 70}
              </p>
              <Slider
                defaultValue={[70]}
                onValueChange={([v]) =>
                  set({ params: { ...params, strength: v } })
                }
              />
            </div>
          )}
          {tool === 'colorize' && (
            <div>
              <p className="text-sm mb-2">Style</p>
              <div className="flex gap-2">
                {['natural', 'vintage', 'vivid'].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => set({ params: { ...params, style: s } })}
                    className={`rounded-full border px-3 py-1 text-xs ${params.style === s || (!params.style && s === 'natural') ? 'bg-black text-white' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {balance !== null && (
            <p className="text-sm text-muted-foreground">
              {t('editor.balance')}: <span className="font-semibold text-foreground">{balance}</span>
              {balance < current.cost && (
                <span className="ml-2 text-amber-600">
                  {t('editor.insufficient')}
                </span>
              )}
            </p>
          )}
          {balance !== null && balance < current.cost ? (
            <Button asChild>
              <Link href={Routes.Pricing}>{t('editor.topup')}</Link>
            </Button>
          ) : (
            <Button onClick={run} disabled={!inputUrl || busy}>
              {t('editor.run')} {currentText.title} ({current.cost}{' '}
              {t('hero.credits.other')})
            </Button>
          )}
          <Button
            variant="outline"
            disabled={!outputUrl}
            onClick={() => outputUrl && window.open(outputUrl, '_blank')}
          >
            Download result
          </Button>
          <p className="text-xs text-muted-foreground">
            3 steps: select tool → upload → download. Free preview, pay only to
            download full quality.
          </p>
        </div>
      </div>
    </div>
  );
}
