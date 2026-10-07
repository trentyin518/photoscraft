import { Logo } from '@/components/layout/logo';

/**
 * Small attribution badge linking back to PhotoCraft.
 */
export default function BuiltWithButton() {
  return (
    <a
      href="https://photoscraft.top?utm_source=built-with-photocraft"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
    >
      <span>Built with</span>
      <Logo className="[&_svg]:size-5 [&_span]:text-xs" />
    </a>
  );
}
