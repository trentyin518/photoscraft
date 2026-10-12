/** Per-tool selectable options shown in the editor side panel.
 *  Values are passed through as job `params` and interpolated into fal prompts.
 *  Thumbnails prefer `image` (remote Unsplash) and fall back to gradient tiles.
 */

export interface StyleOption {
  id: string;
  label: string;
  hint?: string;
  gradient: string;
  /** Thumbnail image URL (optional, falls back to gradient tile) */
  image?: string;
}

const u = (id: string) =>
  `https://images.unsplash.com/${id}?w=240&q=60&auto=format&fit=crop`;

export const HAIRSTYLES: StyleOption[] = [
  { id: 'bob', label: 'Bob', hint: 'chin-length', gradient: 'from-amber-400 to-orange-500', image: u('photo-1517841905240-472988babdf9') },
  { id: 'long-straight', label: 'Long Straight', hint: 'sleek', gradient: 'from-stone-500 to-stone-700', image: u('photo-1529626455594-4ff0802cfb7e') },
  { id: 'long-wavy', label: 'Long Wavy', hint: 'soft waves', gradient: 'from-rose-400 to-pink-600', image: u('photo-1494790108377-be9c29b29330') },
  { id: 'curly', label: 'Curly', hint: 'voluminous', gradient: 'from-yellow-500 to-amber-700', image: u('photo-1531123897727-8f129e1688ce') },
  { id: 'pixie', label: 'Pixie', hint: 'short chic', gradient: 'from-slate-400 to-slate-600', image: u('photo-1519699047748-de8e457a634e') },
  { id: 'bun', label: 'Bun', hint: 'elegant updo', gradient: 'from-purple-400 to-violet-600', image: u('photo-1488426862026-3ee34a7d66df') },
  { id: 'ponytail', label: 'Ponytail', hint: 'high pony', gradient: 'from-sky-400 to-blue-600', image: u('photo-1524504388940-b1c1722653e1') },
  { id: 'bangs', label: 'Bangs', hint: 'fringe', gradient: 'from-teal-400 to-emerald-600', image: u('photo-1492106087820-71f1a00d2b11') },
  { id: 'lob', label: 'Lob', hint: 'long bob', gradient: 'from-orange-400 to-red-500', image: u('photo-1534528741775-53994a69daeb') },
  { id: 'buzz', label: 'Buzz', hint: 'very short', gradient: 'from-zinc-400 to-zinc-600', image: u('photo-1506794778202-cad84cf45f1d') },
  { id: 'fade', label: 'Fade', hint: 'men classic', gradient: 'from-indigo-400 to-indigo-600', image: u('photo-1500648767791-00dcc994a43e') },
  { id: 'braids', label: 'Braids', hint: 'styled', gradient: 'from-lime-400 to-green-600', image: u('photo-1531384441138-2736e62e0919') },
];

export const ROOM_TYPES: StyleOption[] = [
  { id: 'living-room', label: 'Living Room', gradient: 'from-amber-400 to-orange-600', image: u('photo-1586023492125-27b2c045efd7') },
  { id: 'bedroom', label: 'Bedroom', gradient: 'from-sky-400 to-indigo-500', image: u('photo-1505693416388-ac5ce068fe85') },
  { id: 'kitchen', label: 'Kitchen', gradient: 'from-emerald-400 to-teal-600', image: u('photo-1556909114-f6e7ad7d3136') },
  { id: 'bathroom', label: 'Bathroom', gradient: 'from-cyan-400 to-sky-600', image: u('photo-1552321554-5fefe8c9ef14') },
  { id: 'office', label: 'Home Office', gradient: 'from-slate-400 to-slate-600', image: u('photo-1524758631624-e2822e304c36') },
  { id: 'dining-room', label: 'Dining Room', gradient: 'from-rose-400 to-red-500', image: u('photo-1617806118233-18e1de247200') },
];

export const ROOM_STYLES: StyleOption[] = [
  { id: 'modern', label: 'Modern', gradient: 'from-zinc-400 to-zinc-600', image: u('photo-1616486338812-3dadae4b4ace') },
  { id: 'minimalist', label: 'Minimalist', gradient: 'from-stone-300 to-stone-500', image: u('photo-1600585154340-be6161a56a0c') },
  { id: 'scandinavian', label: 'Scandinavian', gradient: 'from-sky-300 to-slate-400', image: u('photo-1595526114035-0d45ed16cfbf') },
  { id: 'industrial', label: 'Industrial', gradient: 'from-neutral-500 to-neutral-800', image: u('photo-1554995207-c18c203602cb') },
  { id: 'bohemian', label: 'Bohemian', gradient: 'from-orange-400 to-pink-500', image: u('photo-1522708323590-d24dbb6b0267') },
  { id: 'luxury', label: 'Luxury', gradient: 'from-yellow-400 to-amber-600', image: u('photo-1618221195710-dd6b41faaea6') },
  { id: 'japandi', label: 'Japandi', gradient: 'from-stone-400 to-emerald-600', image: u('photo-1598928506319-c55ded91a20c') },
  { id: 'mid-century', label: 'Mid-Century', gradient: 'from-amber-500 to-brown-700', image: u('photo-1567016432779-094069958ea5') },
];

export const EXPRESSIONS: StyleOption[] = [
  { id: 'smile', label: 'Smile', gradient: 'from-yellow-300 to-orange-400', image: u('photo-1544005313-94ddf0286df2') },
  { id: 'laugh', label: 'Laugh', gradient: 'from-amber-400 to-red-400', image: u('photo-1539571696357-5a69c17a67c6') },
  { id: 'serious', label: 'Serious', gradient: 'from-slate-400 to-slate-600', image: u('photo-1507003211169-0a1dd7228f2d') },
  { id: 'surprised', label: 'Surprised', gradient: 'from-sky-300 to-blue-400', image: u('photo-1531746020798-e6953c6e8e04') },
];

export const SKIES: StyleOption[] = [
  { id: 'sunset', label: 'Sunset', gradient: 'from-orange-400 via-pink-500 to-purple-600', image: u('photo-1470252649378-9c29740c9fa8') },
  { id: 'blue-sky', label: 'Blue Sky', gradient: 'from-sky-300 to-blue-500', image: u('photo-1504608524841-42fe6f032b4b') },
  { id: 'starry-night', label: 'Starry Night', gradient: 'from-indigo-900 to-black', image: u('photo-1419242902214-272b3f66ee7a') },
  { id: 'storm', label: 'Storm', gradient: 'from-slate-500 to-slate-800', image: u('photo-1534088568595-a066f410bcda') },
  { id: 'rainbow', label: 'Rainbow', gradient: 'from-red-400 via-yellow-300 to-blue-400', image: u('photo-1495616811223-4d98c6e9c869') },
  { id: 'milky-way', label: 'Milky Way', gradient: 'from-purple-800 to-indigo-950', image: u('photo-1462331940025-496dfbfc7564') },
];

export const BACKDROPS: StyleOption[] = [
  { id: 'studio-gray', label: 'Studio Gray', gradient: 'from-zinc-300 to-zinc-500' },
  { id: 'white', label: 'Pure White', gradient: 'from-white to-slate-200' },
  { id: 'gradient', label: 'Gradient', gradient: 'from-violet-400 to-fuchsia-500' },
  { id: 'office', label: 'Office', gradient: 'from-slate-400 to-slate-600', image: u('photo-1497366216548-37526070297c') },
  { id: 'nature', label: 'Nature', gradient: 'from-green-400 to-emerald-600', image: u('photo-1441974231531-c6227db76b6e') },
  { id: 'beach', label: 'Beach', gradient: 'from-cyan-300 to-blue-400', image: u('photo-1507525428034-b723cf961d3e') },
];

export const AVATAR_STYLES: StyleOption[] = [
  { id: 'business', label: 'Business', gradient: 'from-slate-500 to-slate-700', image: u('photo-1560250097-0b93528c311a') },
  { id: 'casual', label: 'Casual', gradient: 'from-sky-400 to-blue-500', image: u('photo-1520975954732-35dd22299614') },
  { id: 'creative', label: 'Creative', gradient: 'from-fuchsia-400 to-purple-600', image: u('photo-1519085360753-af0119f7cbe7') },
  { id: 'linkedin', label: 'LinkedIn', gradient: 'from-blue-600 to-blue-800', image: u('photo-1573496359142-b8d87734a5a2') },
];

export const SCENE_STYLES: StyleOption[] = [
  { id: 'cyberpunk', label: 'Cyberpunk', gradient: 'from-fuchsia-500 to-cyan-400', image: u('photo-1518709268805-4e9042af9f23') },
  { id: 'paris', label: 'Paris', gradient: 'from-rose-300 to-rose-500', image: u('photo-1502602898657-3e91760cbb34') },
  { id: 'beach-sunset', label: 'Beach Sunset', gradient: 'from-orange-400 to-pink-500', image: u('photo-1507525428034-b723cf961d3e') },
  { id: 'mountain', label: 'Mountain', gradient: 'from-emerald-500 to-slate-600', image: u('photo-1506905925346-21bda4d32df4') },
  { id: 'concert', label: 'Concert', gradient: 'from-purple-600 to-black', image: u('photo-1470229722913-7c0e2dbbafd3') },
  { id: 'space', label: 'Space', gradient: 'from-indigo-800 to-black', image: u('photo-1462331940025-496dfbfc7564') },
];

export const ANIME_STYLES: StyleOption[] = [
  { id: 'ghibli', label: 'Ghibli', gradient: 'from-green-300 to-sky-400', image: u('photo-1470071459604-3b5ec3a7fe05') },
  { id: 'shonen', label: 'Shonen', gradient: 'from-orange-400 to-red-500', image: u('photo-1578632767115-351597cf2477') },
  { id: 'shojo', label: 'Shojo', gradient: 'from-pink-300 to-rose-400', image: u('photo-1518895949257-7621c3c786d7') },
  { id: 'cyberpunk-anime', label: 'Cyberpunk', gradient: 'from-cyan-400 to-fuchsia-500', image: u('photo-1518709268805-4e9042af9f23') },
];

export const CARTOON_STYLES: StyleOption[] = [
  { id: 'pixar', label: '3D Pixar', gradient: 'from-sky-400 to-blue-600', image: u('photo-1485846234645-a62644f84728') },
  { id: 'flat', label: 'Flat', gradient: 'from-yellow-300 to-orange-400', image: u('photo-1550684848-fac1c5b4e853') },
  { id: 'comic', label: 'Comic', gradient: 'from-red-400 to-yellow-400', image: u('photo-1612036782180-6f0b6cd846fe') },
  { id: 'clay', label: 'Clay', gradient: 'from-amber-300 to-orange-500', image: u('photo-1513364776144-60967b0f800f') },
];

export const TRANSFORM_STYLES: StyleOption[] = [
  { id: 'streetwear', label: 'Streetwear', gradient: 'from-zinc-500 to-zinc-800', image: u('photo-1529139574466-a303027c1d8b') },
  { id: 'evening-gown', label: 'Evening Gown', gradient: 'from-purple-500 to-pink-500', image: u('photo-1566174053879-31528523f8ae') },
  { id: 'suit', label: 'Suit', gradient: 'from-slate-600 to-black', image: u('photo-1594938298603-c8148c4dae35') },
  { id: 'vintage', label: 'Vintage', gradient: 'from-amber-400 to-yellow-600', image: u('photo-1509631179647-0177331693ae') },
  { id: 'sporty', label: 'Sporty', gradient: 'from-lime-400 to-green-500', image: u('photo-1517649763962-0c623066013b') },
  { id: 'hanfu', label: 'Hanfu', gradient: 'from-red-400 to-rose-600', image: u('photo-1503342217505-b0a15ec3261c') },
];

/** Default params per tool so first run works without selection. */
export const TOOL_DEFAULT_PARAMS: Record<string, Record<string, unknown>> = {
  enhance: { strength: 70 },
  restore: { strength: 70 },
  colorize: { style: 'natural' },
  hairstyle: { hairstyle: 'long-wavy' },
  room: { roomType: 'living-room', roomStyle: 'modern' },
  expression: { expression: 'smile' },
  sky: { sky: 'sunset' },
  'bg-change': { backdrop: 'studio-gray' },
  avatar: { avatarStyle: 'business' },
  scene: { scene: 'cyberpunk' },
  anime: { animeStyle: 'ghibli' },
  cartoon: { cartoonStyle: 'pixar' },
  transform: { outfit: 'streetwear' },
};
