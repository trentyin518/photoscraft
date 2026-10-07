'use server';

import { getDb } from '@/db';
import { creditBalance } from '@/db/photocraft.schema';
import { userActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({});

/**
 * Get current user's credit balance (0 when no row exists).
 */
export const getCreditBalanceAction = userActionClient
  .inputSchema(schema)
  .action(async ({ ctx }) => {
    const db = await getDb();
    const rows = await db
      .select({ balance: creditBalance.balance })
      .from(creditBalance)
      .where(eq(creditBalance.userId, ctx.user.id))
      .limit(1);
    return { balance: rows[0]?.balance ?? 0 };
  });
