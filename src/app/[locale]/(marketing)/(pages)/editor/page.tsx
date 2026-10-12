import { PhotoEditor } from "@/components/photocraft/photo-editor";
import { PHOTO_TOOLS } from "@/config/photo-tools";
import type { PhotoToolType } from "@/db/photocraft.schema";

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ tool?: string; image?: string }> }) {
  const { tool, image } = await searchParams;
  const valid = PHOTO_TOOLS.some((t) => t.id === tool);
  const initialTool = (valid ? tool : "enhance") as PhotoToolType;
  const initialImage =
    typeof image === "string" && image.startsWith("http") ? image : undefined;
  return (
    <div className="container py-8">
      <PhotoEditor initialTool={initialTool} initialImage={initialImage} />
    </div>
  );
}
