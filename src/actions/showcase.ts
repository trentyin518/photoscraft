'use server';

import { getDb } from '@/db';
import { photoJob, showcaseCase, showcaseComment } from '@/db/photocraft.schema';
import { adminActionClient, userActionClient } from '@/lib/safe-action';
import { and, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const shareSchema = z.object({
  photoJobId: z.string().min(1),
  title: z.string().min(2).max(80),
  description: z.string().max(500).optional().default(''),
});

export const sharePhotoAction = userActionClient
  .inputSchema(shareSchema)
  .action(async ({ ctx, parsedInput }) => {
    const db = await getDb();
    const [job] = await db
      .select()
      .from(photoJob)
      .where(
        and(eq(photoJob.id, parsedInput.photoJobId), eq(photoJob.userId, ctx.user.id))
      )
      .limit(1);
    if (!job?.outputUrl) {
      throw new Error('Photo not ready for sharing');
    }
    const existing = await db
      .select({ id: showcaseCase.id })
      .from(showcaseCase)
      .where(eq(showcaseCase.photoJobId, job.id))
      .limit(1);
    if (existing.length > 0) {
      return { success: true, data: { id: existing[0].id, duplicate: true } };
    }
    const id = nanoid();
    await db.insert(showcaseCase).values({
      id,
      userId: ctx.user.id,
      photoJobId: job.id,
      title: parsedInput.title,
      description: parsedInput.description || null,
      imageUrl: job.outputUrl,
      tool: job.tool,
      status: 'pending',
    });
    return { success: true, data: { id, duplicate: false } };
  });

const commentSchema = z.object({
  caseId: z.string().min(1),
  content: z.string().min(1).max(500),
});

export const addShowcaseCommentAction = userActionClient
  .inputSchema(commentSchema)
  .action(async ({ ctx, parsedInput }) => {
    const db = await getDb();
    const id = nanoid();
    await db.insert(showcaseComment).values({
      id,
      caseId: parsedInput.caseId,
      userId: ctx.user.id,
      content: parsedInput.content,
      status: 'pending',
    });
    return { success: true, data: { id } };
  });

const reviewCaseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['approved', 'rejected']),
});

export const reviewShowcaseCaseAction = adminActionClient
  .inputSchema(reviewCaseSchema)
  .action(async ({ parsedInput }) => {
    const db = await getDb();
    await db
      .update(showcaseCase)
      .set({ status: parsedInput.status, updatedAt: new Date() })
      .where(eq(showcaseCase.id, parsedInput.id));
    return { success: true };
  });

export const reviewShowcaseCommentAction = adminActionClient
  .inputSchema(reviewCaseSchema)
  .action(async ({ parsedInput }) => {
    const db = await getDb();
    await db
      .update(showcaseComment)
      .set({ status: parsedInput.status })
      .where(eq(showcaseComment.id, parsedInput.id));
    return { success: true };
  });

export const deleteShowcaseCaseAction = adminActionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const db = await getDb();
    await db.delete(showcaseCase).where(eq(showcaseCase.id, parsedInput.id));
    return { success: true };
  });

export async function getApprovedCases() {
  const db = await getDb();
  return db
    .select()
    .from(showcaseCase)
    .where(eq(showcaseCase.status, 'approved'))
    .orderBy(desc(showcaseCase.createdAt))
    .limit(60);
}

export async function getApprovedComments(caseId: string) {
  const db = await getDb();
  return db
    .select()
    .from(showcaseComment)
    .where(and(eq(showcaseComment.caseId, caseId), eq(showcaseComment.status, 'approved')))
    .orderBy(desc(showcaseComment.createdAt))
    .limit(50);
}

export async function getPendingCases() {
  const db = await getDb();
  return db
    .select()
    .from(showcaseCase)
    .where(eq(showcaseCase.status, 'pending'))
    .orderBy(desc(showcaseCase.createdAt))
    .limit(100);
}

export async function getPendingComments() {
  const db = await getDb();
  return db
    .select()
    .from(showcaseComment)
    .where(eq(showcaseComment.status, 'pending'))
    .orderBy(desc(showcaseComment.createdAt))
    .limit(100);
}
