'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export interface MaskPainterHandle {
  /** Export black-background / white-stroke mask, or null if nothing painted */
  exportMask: () => Promise<Blob | null>;
  hasMask: () => boolean;
}

/**
 * Paint-over mask editor for watermark / eraser tools.
 * White strokes = area to inpaint. Backed by lama (mask_image_url).
 */
export const MaskPainter = forwardRef<MaskPainterHandle, { imageUrl: string }>(
  function MaskPainter({ imageUrl }, ref) {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [painting, setPainting] = useState(false);
    const [brush, setBrush] = useState(40);
    const [strokes, setStrokes] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);

    // size canvas to displayed image — only after the image has loaded,
    // otherwise getBoundingClientRect is 0 and the exported mask is blank
    useEffect(() => {
      if (!imgLoaded) return;
      const sync = () => {
        const img = imgRef.current;
        const cv = canvasRef.current;
        if (!img || !cv) return;
        const r = img.getBoundingClientRect();
        cv.width = Math.max(1, Math.round(r.width));
        cv.height = Math.max(1, Math.round(r.height));
      };
      sync();
      window.addEventListener('resize', sync);
      return () => window.removeEventListener('resize', sync);
    }, [imageUrl, imgLoaded]);

    const pos = (e: React.PointerEvent) => {
      const cv = canvasRef.current!;
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const draw = (e: React.PointerEvent) => {
      if (!painting) return;
      const cv = canvasRef.current!;
      const ctx = cv.getContext('2d')!;
      const { x, y } = pos(e);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = brush;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const last = cv as unknown as { _lx?: number; _ly?: number };
      const lx = last._lx;
      const ly = last._ly;
      if (lx === undefined || ly === undefined) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 0.1, y + 0.1);
      } else {
        ctx.moveTo(lx, ly);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      last._lx = x;
      last._ly = y;
    };

    const stop = () => {
      setPainting(false);
      const cv = canvasRef.current as unknown as {
        _lx?: number;
        _ly?: number;
      } | null;
      if (cv) {
        delete cv._lx;
        delete cv._ly;
      }
      setStrokes((s) => s + 1);
    };

    const clear = () => {
      const cv = canvasRef.current!;
      cv.getContext('2d')!.clearRect(0, 0, cv.width, cv.height);
      setStrokes(0);
    };

    useImperativeHandle(ref, () => ({
      hasMask: () => strokes > 0,
      exportMask: async () => {
        if (strokes === 0) return null;
        const cv = canvasRef.current!;
        const img = imgRef.current!;
        // render mask at natural resolution for precise inpainting
        const out = document.createElement('canvas');
        out.width = img.naturalWidth;
        out.height = img.naturalHeight;
        const ctx = out.getContext('2d')!;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(cv, 0, 0, out.width, out.height);
        // guard: reject blank masks (e.g. canvas was 0-size when painted)
        const px = ctx.getImageData(0, 0, out.width, out.height).data;
        let lit = 0;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i] > 64 || px[i + 1] > 64 || px[i + 2] > 64) {
            lit++;
            if (lit > 100) break;
          }
        }
        if (lit <= 100) return null;
        return new Promise<Blob | null>((resolve) =>
          out.toBlob((b) => resolve(b), 'image/png')
        );
      },
    }));

    return (
      <div className="flex flex-col gap-2">
        <div className="relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="paint over the watermark"
            onLoad={() => setImgLoaded(true)}
            className="block w-full touch-none select-none"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              setPainting(true);
              draw(e);
            }}
            onPointerMove={draw}
            onPointerUp={stop}
            onPointerCancel={stop}
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            Brush {brush}px
          </p>
          <Slider
            value={[brush]}
            min={8}
            max={120}
            onValueChange={([v]) => setBrush(v)}
          />
          <Button type="button" variant="outline" size="sm" onClick={clear}>
            Clear
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paint over the watermark (e.g. the bottom-right text), then Run — only
          the painted area is rebuilt.
        </p>
      </div>
    );
  }
);
