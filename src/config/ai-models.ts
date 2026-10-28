import type { PhotoToolType } from '@/db/photocraft.schema';

export type AiModelRole =
  | 'generative-edit'
  | 'upscale'
  | 'background-removal'
  | 'inpainting';

export interface AiModelInfo {
  id: string;
  name: string;
  provider: string;
  role: AiModelRole;
  /** Tools that currently route to this model. */
  tools: PhotoToolType[];
}

export const NANO_BANANA = 'Nano Banana (Gemini 2.5 Flash Image)';
export const CLARITY_UPSCALER = 'Clarity Upscaler';
export const BIREFNET = 'BiRefNet';
export const REMBG = 'rembg';
export const LAMA = 'LaMa (Large Mask Inpainting)';

/**
 * Public model disclosure. Keep this in sync with `specForTool` in
 * `src/lib/fal.ts` whenever model routing changes.
 */
export const AI_MODEL_CATALOG: AiModelInfo[] = [
  {
    id: 'nano-banana',
    name: NANO_BANANA,
    provider: 'Google DeepMind',
    role: 'generative-edit',
    tools: [
      'restore',
      'colorize',
      'watermark',
      'eraser',
      'expression',
      'hairstyle',
      'bg-change',
      'sky',
      'avatar',
      'scene',
      'anime',
      'cartoon',
      'transform',
      'room',
    ],
  },
  {
    id: 'clarity-upscaler',
    name: CLARITY_UPSCALER,
    provider: 'Clarity AI',
    role: 'upscale',
    tools: ['enhance'],
  },
  {
    id: 'birefnet',
    name: BIREFNET,
    provider: 'ZhengPeng7',
    role: 'background-removal',
    tools: ['bg'],
  },
  {
    id: 'rembg',
    name: REMBG,
    provider: 'danielgatis',
    role: 'background-removal',
    tools: ['bg'],
  },
  {
    id: 'lama',
    name: LAMA,
    provider: 'Samsung AI',
    role: 'inpainting',
    tools: ['watermark', 'eraser'],
  },
];

/**
 * The model shown in the editor for each tool. Mask-based removal routes to
 * LaMa, while maskless cleanup falls back to Nano Banana; show both.
 */
export const TOOL_MODEL_DISPLAY: Record<PhotoToolType, string> = {
  enhance: CLARITY_UPSCALER,
  restore: NANO_BANANA,
  colorize: NANO_BANANA,
  watermark: `${LAMA} / ${NANO_BANANA}`,
  bg: `${BIREFNET} / ${REMBG}`,
  eraser: `${LAMA} / ${NANO_BANANA}`,
  expression: NANO_BANANA,
  hairstyle: NANO_BANANA,
  'bg-change': NANO_BANANA,
  sky: NANO_BANANA,
  avatar: NANO_BANANA,
  scene: NANO_BANANA,
  anime: NANO_BANANA,
  cartoon: NANO_BANANA,
  transform: NANO_BANANA,
  room: NANO_BANANA,
};
