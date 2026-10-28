'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { usePhotoEditorStore } from '@/stores/photo-editor-store';
import { createPhotoJob } from '@/actions/create-photo-job';
import { MaskPainter, type MaskPainterHandle } from './mask-painter';
import { getCreditBalanceAction } from '@/actions/get-credit-balance';
import { PHOTO_TOOLS, getPhotoToolText } from '@/config/photo-tools';
import { TOOL_MODEL_DISPLAY } from '@/config/ai-models';
import {
  ANIME_STYLES,
  AVATAR_STYLES,
  BACKDROPS,
  CARTOON_STYLES,
  EXPRESSIONS,
  HAIRSTYLES,
  ROOM_STYLES,
  ROOM_TYPES,
  SCENE_STYLES,
  SKIES,
  TOOL_DEFAULT_PARAMS,
  TRANSFORM_STYLES,
  type StyleOption,
} from '@/config/tool-options';
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
  initialImage,
}: {
  initialTool?: PhotoToolType;
  initialImage?: string;
}) {
  const { tool, inputUrl, outputUrl, status, params, set } =
    usePhotoEditorStore();
  const t = useTranslations('PhotoTools');
  const tr = t as unknown as (key: string) => string;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const painterRef = useRef<MaskPainterHandle>(null);
  const needsMask = tool === 'watermark' || tool === 'eraser';

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
    set({
      tool: initialTool,
      inputUrl: initialImage ?? null,
      outputUrl: null,
      jobId: null,
      status: 'idle',
      params: { ...(TOOL_DEFAULT_PARAMS[initialTool] ?? { strength: 70 }) },
    });
    setErr(null);
  }, [initialTool, initialImage, set]);
  const current =
    PHOTO_TOOLS.find((item) => item.id === tool) ?? PHOTO_TOOLS[0];
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
    // Precision tools need a painted mask — otherwise the edit model just
    // "cleans up" and small corner text like this survives untouched.
    if (needsMask && !painterRef.current?.hasMask()) {
      setErr('请先用笔刷涂抹水印区域再运行 / Paint over the watermark first');
      return;
    }
    setBusy(true);
    setErr(null);
    set({ status: 'processing', outputUrl: null });
    try {
      const runParams: Record<string, unknown> = { ...params };
      // watermark / eraser: upload user-painted mask for precise lama inpaint
      if (needsMask && painterRef.current?.hasMask()) {
        const blob = await painterRef.current.exportMask();
        if (!blob) {
          throw new Error(
            '涂抹区域为空，请重新涂抹水印后再运行 / Painted area is empty, please repaint'
          );
        }
        const fd = new FormData();
        fd.append('file', new File([blob], 'mask.png', { type: 'image/png' }));
        fd.append('folder', 'photocraft/masks');
        const up = await fetch('/api/storage/upload', {
          method: 'POST',
          body: fd,
        });
        if (!up.ok)
          throw new Error('Mask upload failed — please sign in and retry');
        const mj = (await up.json()) as { url: string };
        runParams.maskUrl = mj.url;
      }
      const runAction = createPhotoJob as unknown as (input: {
        tool: typeof tool;
        inputUrl: string;
        params: Record<string, unknown>;
      }) => Promise<{ data?: { jobId: string } }>;
      const r = await runAction({ tool, inputUrl, params: runParams });
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
          onValueChange={(v) => {
            setErr(null);
            const next = v as PhotoToolType;
            set({
              tool: next,
              inputUrl: null,
              outputUrl: null,
              jobId: null,
              status: 'idle',
              params: { ...(TOOL_DEFAULT_PARAMS[next] ?? { strength: 70 }) },
            });
          }}
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
            <p className="text-sm text-muted-foreground">
              {currentText.tagline}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('editor.model')}:{' '}
              <span className="font-medium text-foreground">
                {TOOL_MODEL_DISPLAY[tool]}
              </span>
            </p>
          </div>
          {needsMask && inputUrl ? (
            <MaskPainter
              key={`${tool}-${inputUrl}`}
              ref={painterRef}
              imageUrl={inputUrl}
            />
          ) : (
            <div className="relative">
              <label className="flex h-56 cursor-pointer items-center justify-center rounded-lg border-dashed border-2 text-sm text-muted-foreground overflow-hidden">
                {inputUrl ? (
                  <img
                    src={inputUrl}
                    alt=""
                    className="h-full object-contain"
                  />
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
                    // allow re-selecting the same file to re-upload
                    e.target.value = '';
                  }}
                />
              </label>
              {inputUrl && (
                <button
                  type="button"
                  onClick={() =>
                    set({
                      inputUrl: null,
                      outputUrl: null,
                      jobId: null,
                      status: 'idle',
                    })
                  }
                  className="absolute top-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white hover:bg-black/80"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          )}
          {outputUrl && (
            <div>
              <p className="text-xs mb-1">{t('hero.after')}</p>
              <div className="flex h-56 items-center justify-center overflow-hidden rounded-lg border">
                <img
                  src={outputUrl}
                  alt="result"
                  className="h-full object-contain"
                />
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
          <ToolOptionPanel tool={tool} params={params} set={set} />
          {balance !== null && (
            <p className="text-sm text-muted-foreground">
              {t('editor.balance')}:{' '}
              <span className="font-semibold text-foreground">{balance}</span>
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

/** Thumbnail visual: remote image with gradient fallback if it fails to load. */
function ThumbVisual({ option: o }: { option: StyleOption }) {
  const [failed, setFailed] = useState(false);
  if (!o.image || failed) {
    return (
      <span
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${o.gradient}`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={o.image}
      alt={o.label}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className="pointer-events-none absolute inset-0 size-full object-cover"
    />
  );
}

function ThumbGrid({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: StyleOption[];
  value: unknown;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              type="button"
              key={o.id}
              onClick={() => onPick(o.id)}
              aria-pressed={active}
              className={`group relative overflow-hidden rounded-lg border-2 text-left transition ${
                active
                  ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)]'
                  : 'border-transparent hover:border-foreground/40'
              }`}
              title={o.hint ?? o.label}
            >
              <span className="relative flex h-14 items-end justify-center overflow-hidden rounded-[6px] bg-muted">
                <ThumbVisual option={o} />
                {active && <span className="pointer-events-none absolute inset-0 bg-blue-500/20" />}
                <span
                  className={`relative m-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-black/55 text-white'
                  }`}
                >
                  {o.label}
                </span>
              </span>
              {active && (
                <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Right-panel options per tool: thumbnails / type+style pickers. */
function ToolOptionPanel({
  tool,
  params,
  set,
}: {
  tool: PhotoToolType;
  params: Record<string, unknown>;
  set: (p: {
    params: Record<string, unknown>;
  }) => void;
}) {
  const pick = (k: string, v: unknown) =>
    set({ params: { ...params, [k]: v } });

  if (tool === 'enhance' || tool === 'restore') {
    return (
      <div>
        <p className="text-sm mb-2">Strength {(params.strength as number) ?? 70}</p>
        <Slider
          defaultValue={[(params.strength as number) ?? 70]}
          onValueChange={([v]) => pick('strength', v)}
        />
      </div>
    );
  }
  if (tool === 'hairstyle')
    return (
      <ThumbGrid
        title="Hairstyle"
        options={HAIRSTYLES}
        value={params.hairstyle}
        onPick={(id) => pick('hairstyle', id)}
      />
    );
  if (tool === 'room')
    return (
      <div className="flex flex-col gap-4">
        <ThumbGrid
          title="Room type"
          options={ROOM_TYPES}
          value={params.roomType}
          onPick={(id) => pick('roomType', id)}
        />
        <ThumbGrid
          title="Style"
          options={ROOM_STYLES}
          value={params.roomStyle}
          onPick={(id) => pick('roomStyle', id)}
        />
      </div>
    );
  const single: Record<string, { title: string; key: string; options: StyleOption[] }> = {
    colorize: {
      title: 'Style',
      key: 'style',
      options: [
        { id: 'natural', label: 'Natural', gradient: 'from-stone-300 to-stone-500' },
        { id: 'vintage', label: 'Vintage', gradient: 'from-amber-400 to-orange-600' },
        { id: 'vivid', label: 'Vivid', gradient: 'from-pink-400 to-purple-500' },
      ],
    },
    expression: { title: 'Expression', key: 'expression', options: EXPRESSIONS },
    sky: { title: 'Sky', key: 'sky', options: SKIES },
    'bg-change': { title: 'Backdrop', key: 'backdrop', options: BACKDROPS },
    avatar: { title: 'Avatar style', key: 'avatarStyle', options: AVATAR_STYLES },
    scene: { title: 'Scene', key: 'scene', options: SCENE_STYLES },
    anime: { title: 'Anime style', key: 'animeStyle', options: ANIME_STYLES },
    cartoon: { title: 'Cartoon style', key: 'cartoonStyle', options: CARTOON_STYLES },
    transform: { title: 'Outfit', key: 'outfit', options: TRANSFORM_STYLES },
  };
  const cfg = single[tool];
  if (cfg)
    return (
      <ThumbGrid
        title={cfg.title}
        options={cfg.options}
        value={params[cfg.key]}
        onPick={(id) => pick(cfg.key, id)}
      />
    );
  return null;
}
