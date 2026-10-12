'use server';
import { z } from 'zod';
import { getDb } from '@/db';
import { photoJob } from '@/db/photocraft.schema';
import { userActionClient } from '@/lib/safe-action';
import { and, eq } from 'drizzle-orm';

const schema = z.object({
  id: z.string().min(1),
});

export const deletePhotoJob = userActionClient
  .inputSchema(schema)
  .action(async ({ ctx, parsedInput }) => {
    const db = await getDb();
    await db
      .delete(photoJob)
      .where(
        and(
          eq(photoJob.id, parsedInput.id),
          eq(photoJob.userId, ctx.user.id)
        )
      );
    return { ok: true };
  });

export const deletePhotoJobs = userActionClient
  .inputSchema(z.object({ ids: z.array(z.string().min(1)).min(1).max(100) }))
  .action(async ({ ctx, parsedInput }) => {
    const db = await getDb();
    for (const id of parsedInput.ids) {
      await db
        .delete(photoJob)
        .where(and(eq(photoJob.id, id), eq(photoJob.userId, ctx.user.id)));
    }
    return { ok: true, count: parsedInput.ids.length };
  });
