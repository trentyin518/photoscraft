import {
  BrushIcon,
  CloudSunIcon,
  ImagePlusIcon,
  ImagesIcon,
  PaletteIcon,
  ScissorsIcon,
  SmileIcon,
  SparklesIcon,
  Wand2Icon,
} from 'lucide-react';
import type { PhotoToolType } from '@/db/photocraft.schema';

export interface PhotoTool {
  id: PhotoToolType;
  title: string;
  tagline: string;
  category: 'Enhance' | 'Background' | 'Creative' | 'Fun';
  icon: React.ReactNode;
  gradient: string;
  cost: number;
  hot?: boolean;
}

export const PHOTO_TOOL_CATEGORIES = [
  'Enhance',
  'Background',
  'Creative',
  'Fun',
] as const;

/** Mirrors the mobile app grid, grouped for desktop. */
export const PHOTO_TOOLS: PhotoTool[] = [
  {
    id: 'enhance',
    title: 'AI Photo Enhancer',
    tagline: 'Deblur, denoise, 4K clarity in one tap',
    category: 'Enhance',
    icon: <SparklesIcon className="size-5" />,
    gradient: 'from-violet-500 to-fuchsia-500',
    cost: 1,
    hot: true,
  },
  {
    id: 'restore',
    title: 'AI Old Photo Restore',
    tagline: 'Fix scratches, creases and damage',
    category: 'Enhance',
    icon: <ImagesIcon className="size-5" />,
    gradient: 'from-amber-500 to-orange-500',
    cost: 2,
    hot: true,
  },
  {
    id: 'colorize',
    title: 'AI Photo Colorizer',
    tagline: 'Black & white → vivid color',
    category: 'Enhance',
    icon: <PaletteIcon className="size-5" />,
    gradient: 'from-rose-500 to-pink-500',
    cost: 2,
    hot: true,
  },
  {
    id: 'eraser',
    title: 'AI Magic Eraser',
    tagline: 'Remove objects, people and text',
    category: 'Enhance',
    icon: <BrushIcon className="size-5" />,
    gradient: 'from-cyan-500 to-blue-500',
    cost: 1,
  },
  {
    id: 'watermark',
    title: 'Watermark Remover',
    tagline: 'Clean logos and overlays',
    category: 'Enhance',
    icon: <Wand2Icon className="size-5" />,
    gradient: 'from-slate-500 to-gray-600',
    cost: 1,
  },
  {
    id: 'bg',
    title: 'AI Background Remover',
    tagline: 'Precise cutout, hair-level edges',
    category: 'Background',
    icon: <ScissorsIcon className="size-5" />,
    gradient: 'from-emerald-500 to-teal-500',
    cost: 1,
    hot: true,
  },
  {
    id: 'bg-change',
    title: 'AI Background Changer',
    tagline: 'Studio backdrops in one click',
    category: 'Background',
    icon: <ImagePlusIcon className="size-5" />,
    gradient: 'from-indigo-500 to-violet-500',
    cost: 1,
  },
  {
    id: 'sky',
    title: 'AI Sky Replacer',
    tagline: 'Sunset, stars, drama skies',
    category: 'Background',
    icon: <CloudSunIcon className="size-5" />,
    gradient: 'from-sky-500 to-indigo-500',
    cost: 1,
  },
  {
    id: 'room',
    title: 'AI Room Design',
    tagline: 'Restyle interiors photorealistically',
    category: 'Background',
    icon: <ImagePlusIcon className="size-5" />,
    gradient: 'from-stone-500 to-amber-600',
    cost: 2,
  },
  {
    id: 'avatar',
    title: 'AI Avatar Generator',
    tagline: 'Pro studio avatars',
    category: 'Creative',
    icon: <SmileIcon className="size-5" />,
    gradient: 'from-purple-500 to-violet-600',
    cost: 2,
    hot: true,
  },
  {
    id: 'scene',
    title: 'AI Scene Generator',
    tagline: 'Cinematic scenes with you in it',
    category: 'Creative',
    icon: <ImagesIcon className="size-5" />,
    gradient: 'from-blue-500 to-cyan-500',
    cost: 2,
  },
  {
    id: 'anime',
    title: 'AI Anime Generator',
    tagline: 'Photo → anime illustration',
    category: 'Fun',
    icon: <SparklesIcon className="size-5" />,
    gradient: 'from-pink-500 to-rose-500',
    cost: 2,
  },
  {
    id: 'cartoon',
    title: 'AI Cartoonizer',
    tagline: 'Fun cartoon portraits',
    category: 'Fun',
    icon: <SmileIcon className="size-5" />,
    gradient: 'from-yellow-500 to-orange-500',
    cost: 2,
  },
  {
    id: 'hairstyle',
    title: 'AI Hairstyle Changer',
    tagline: 'Try new hair instantly',
    category: 'Fun',
    icon: <PaletteIcon className="size-5" />,
    gradient: 'from-teal-500 to-emerald-500',
    cost: 2,
  },
  {
    id: 'expression',
    title: 'AI Expression Changer',
    tagline: 'Natural smiles, same you',
    category: 'Fun',
    icon: <SmileIcon className="size-5" />,
    gradient: 'from-lime-500 to-green-500',
    cost: 2,
  },
  {
    id: 'transform',
    title: 'AI Transform',
    tagline: 'Fashion-shoot restyle',
    category: 'Fun',
    icon: <Wand2Icon className="size-5" />,
    gradient: 'from-fuchsia-500 to-purple-600',
    cost: 2,
  },
];
