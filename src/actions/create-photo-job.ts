'use server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDb } from '@/db';
import {
  TOOL_CREDIT_COST,
  creditBalance,
  photoJob,
  type PhotoToolType,
} from '@/db/photocraft.schema';
import { userActionClient } from '@/lib/safe-action';
import { runFalEdit } from '@/lib/fal';
import { and, eq, gte, sql } from 'drizzle-orm';

const schema = z.object({
  tool: z.enum([
    'enhance',
    'restore',
    'colorize',
    'watermark',
    'bg',
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
  ]),
  inputUrl: z.string().url(),
  params: z.record(z.string(), z.unknown()).default({}),
});

export const createPhotoJob = userActionClient
  .inputSchema(schema)
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.user.id;
    const tool = parsedInput.tool as PhotoToolType;
    const cost = TOOL_CREDIT_COST[tool];
    const db = await getDb();

    // Pre-check only — no deduction here. Credits are deducted atomically
    // AFTER a successful run, so failed jobs never cost the user anything.
    const rows = await db
      .select()
      .from(creditBalance)
      .where(eq(creditBalance.userId, userId))
      .limit(1);
    const bal = rows[0];
    if (!bal || bal.balance < cost) throw new Error('INSUFFICIENT_CREDITS');

    const id = nanoid();
    await db.insert(photoJob).values({
      id,
      userId,
      tool,
      inputUrl: parsedInput.inputUrl,
      params: parsedInput.params,
      costCredits: cost,
      status: 'processing',
    });

    try {
      const outputUrl = await runFalEdit({
        tool,
        imageUrl: parsedInput.inputUrl,
        params: parsedInput.params as Record<string, unknown>,
      });

      // Atomic deduct guarded by balance >= cost: concurrent jobs cannot
      // overspend the account even though the deduction happens on success.
      const deducted = await db
        .update(creditBalance)
        .set({ balance: sql`${creditBalance.balance} - ${cost}` })
        .where(
          and(
            eq(creditBalance.userId, userId),
            gte(creditBalance.balance, cost)
          )
        )
        .returning({ userId: creditBalance.userId });

      if (deducted.length === 0) {
        await db
          .update(photoJob)
          .set({ status: 'failed', error: 'INSUFFICIENT_CREDITS', outputUrl })
          .where(eq(photoJob.id, id));
        throw new Error('INSUFFICIENT_CREDITS');
      }

      await db
        .update(photoJob)
        .set({ outputUrl, status: 'done' })
        .where(eq(photoJob.id, id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'FAL_FAILED';
      // Only mark failed if not already handled above (insufficient credits
      // path already wrote outputUrl + status).
      if (msg !== 'INSUFFICIENT_CREDITS') {
        await db
          .update(photoJob)
          .set({ status: 'failed', error: msg })
          .where(eq(photoJob.id, id));
      }
      if (msg === 'INSUFFICIENT_CREDITS') {
        throw e;
      }
    }

    return { jobId: id };
  });
