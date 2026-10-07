import * as authSchema from './auth.schema';
import * as appSchema from './app.schema';
import * as photocraftSchema from './photocraft.schema';

/**
 * Re-export all tables so drizzle-kit can discover them when reading this file.
 * https://orm.drizzle.team/docs/drizzle-kit-generate
 */
export * from './auth.schema';
export * from './app.schema';
export * from './photocraft.schema';

export const schema = {
  ...authSchema,
  ...appSchema,
  ...photocraftSchema,
} as const;
