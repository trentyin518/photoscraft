import { create } from "zustand";
import type { PhotoToolType } from "@/db/photocraft.schema";

interface EditorState {
  tool: PhotoToolType;
  inputUrl: string | null;
  outputUrl: string | null;
  jobId: string | null;
  status: "idle" | "uploading" | "processing" | "done" | "failed";
  params: Record<string, unknown>;
  set: (p: Partial<EditorState>) => void;
  reset: () => void;
}

export const usePhotoEditorStore = create<EditorState>((set) => ({
  tool: "enhance",
  inputUrl: null,
  outputUrl: null,
  jobId: null,
  status: "idle",
  params: { strength: 70 },
  set: (p) => set(p),
  reset: () => set({ inputUrl: null, outputUrl: null, jobId: null, status: "idle" }),
}));
