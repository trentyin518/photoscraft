import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { photoJob } from "@/db/photocraft.schema";
import { eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db.select().from(photoJob).where(eq(photoJob.id, id)).limit(1);
  const job = rows[0];
  if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ status: job.status, outputUrl: job.outputUrl, tool: job.tool });
}
