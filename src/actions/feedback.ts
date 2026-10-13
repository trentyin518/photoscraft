'use server';

import { getDb } from '@/db';
import { feedback } from '@/db/photocraft.schema';
import { adminActionClient, userActionClient } from '@/lib/safe-action';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const submitSchema = z.object({
  category: z.enum(['bug', 'suggestion', 'question', 'other']).default('suggestion'),
  content: z.string().min(10).max(2000),
});

export const submitFeedbackAction = userActionClient
  .inputSchema(submitSchema)
  .action(async ({ ctx, parsedInput }) => {
    const db = await getDb();
    const id = nanoid();
    await db.insert(feedback).values({
      id,
      userId: ctx.user.id,
      category: parsedInput.category,
      content: parsedInput.content,
      status: 'open',
    });
    return { success: true, data: { id } };
  });

export const updateFeedbackStatusAction = adminActionClient
  .inputSchema(
    z.object({
      id: z.string().min(1),
      status: z.enum(['open', 'reviewed', 'resolved']),
    })
  )
  .action(async ({ parsedInput }) => {
    const db = await getDb();
    await db
      .update(feedback)
      .set({ status: parsedInput.status, updatedAt: new Date() })
      .where(eq(feedback.id, parsedInput.id));
    return { success: true };
  });

export async function getMyFeedback(userId: string) {
  const db = await getDb();
  return db
    .select()
    .from(feedback)
    .where(eq(feedback.userId, userId))
    .orderBy(desc(feedback.createdAt))
    .limit(50);
}

export async function getAllFeedback() {
  const db = await getDb();
  return db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(200);
}
