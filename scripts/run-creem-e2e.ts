import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { loadEnv } from 'vite';
import {
  E2E_BETTER_AUTH_SECRET,
  E2E_TEST_SECRET,
} from '../tests/e2e/fixtures/test-data';

/**
 * Bootstrap for `pnpm e2e:creem`.
 *
 * Creem does not provide a local webhook-forwarding CLI. The Playwright
 * config starts the local Next.js server automatically; the caller still
 * needs to expose its port with an HTTPS tunnel and register that URL as a
 * Creem test webhook before starting a paid flow.
 */

async function main() {
  const port = Number(process.env.CREEM_E2E_PORT ?? 3120);
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
  const envFile = process.env.CREEM_ENV_FILE;
  const sourceEnv: Record<string, string> = {};

  if (envFile) {
    const absoluteEnvFile = resolve(envFile);
    if (!existsSync(absoluteEnvFile)) {
      throw new Error(`CREEM_ENV_FILE does not exist: ${absoluteEnvFile}`);
    }
    loadDotenv({
      path: absoluteEnvFile,
      processEnv: sourceEnv,
      quiet: true,
    });
  }

  const currentEnv = loadEnv('development', process.cwd(), '');
  const first = (...values: Array<string | undefined>) =>
    values.find((value) => Boolean(value));
  const mappedCreemEnv = {
    CREEM_API_KEY: first(
      process.env.CREEM_API_KEY,
      sourceEnv.CREEM_API_KEY,
      currentEnv.CREEM_API_KEY
    ),
    CREEM_WEBHOOK_SECRET: first(
      process.env.CREEM_WEBHOOK_SECRET,
      sourceEnv.CREEM_WEBHOOK_SECRET,
      currentEnv.CREEM_WEBHOOK_SECRET
    ),
    CREEM_DEBUG: first(
      process.env.CREEM_DEBUG,
      sourceEnv.CREEM_DEBUG,
      currentEnv.CREEM_DEBUG
    ),
    NEXT_PUBLIC_CREEM_PRODUCT_PRO_MONTHLY: first(
      process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO_MONTHLY,
      process.env.VITE_CREEM_PRODUCT_PRO_MONTHLY,
      sourceEnv.NEXT_PUBLIC_CREEM_PRODUCT_PRO_MONTHLY,
      sourceEnv.VITE_CREEM_PRODUCT_PRO_MONTHLY,
      currentEnv.NEXT_PUBLIC_CREEM_PRODUCT_PRO_MONTHLY,
      currentEnv.VITE_CREEM_PRODUCT_PRO_MONTHLY
    ),
    NEXT_PUBLIC_CREEM_PRODUCT_PRO_YEARLY: first(
      process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO_YEARLY,
      process.env.VITE_CREEM_PRODUCT_PRO_YEARLY,
      sourceEnv.NEXT_PUBLIC_CREEM_PRODUCT_PRO_YEARLY,
      sourceEnv.VITE_CREEM_PRODUCT_PRO_YEARLY,
      currentEnv.NEXT_PUBLIC_CREEM_PRODUCT_PRO_YEARLY,
      currentEnv.VITE_CREEM_PRODUCT_PRO_YEARLY
    ),
    NEXT_PUBLIC_CREEM_PRODUCT_LIFETIME: first(
      process.env.NEXT_PUBLIC_CREEM_PRODUCT_LIFETIME,
      process.env.VITE_CREEM_PRODUCT_LIFETIME,
      sourceEnv.NEXT_PUBLIC_CREEM_PRODUCT_LIFETIME,
      sourceEnv.VITE_CREEM_PRODUCT_LIFETIME,
      currentEnv.NEXT_PUBLIC_CREEM_PRODUCT_LIFETIME,
      currentEnv.VITE_CREEM_PRODUCT_LIFETIME
    ),
  };

  const runtimeEnv: NodeJS.ProcessEnv = {
    ...currentEnv,
    ...sourceEnv,
    ...process.env,
    ...mappedCreemEnv,
    CREEM_DEBUG: mappedCreemEnv.CREEM_DEBUG ?? 'true',
    NEXT_PUBLIC_PAYMENT_PROVIDER: 'creem',
    NEXT_PUBLIC_BASE_URL: baseURL,
    NEXT_PUBLIC_DEMO_WEBSITE: 'true',
    NEXT_PUBLIC_E2E_TEST_MODE: 'true',
    E2E_TEST_SECRET,
    BETTER_AUTH_SECRET: E2E_BETTER_AUTH_SECRET,
    CREEM_E2E_PORT: String(port),
    PLAYWRIGHT_BASE_URL: baseURL,
  };

  const requiredVariables = [
    'CREEM_API_KEY',
    'CREEM_WEBHOOK_SECRET',
    'NEXT_PUBLIC_CREEM_PRODUCT_PRO_MONTHLY',
    'NEXT_PUBLIC_CREEM_PRODUCT_PRO_YEARLY',
    'NEXT_PUBLIC_CREEM_PRODUCT_LIFETIME',
  ] as const;

  for (const variable of requiredVariables) {
    if (!runtimeEnv[variable]) {
      throw new Error(
        `${variable} is required. Use CREEM_ENV_FILE to load a Creem sandbox env file or set it in the current environment.`
      );
    }
  }

  if (runtimeEnv.CREEM_DEBUG !== 'true') {
    throw new Error(
      'Creem sandbox E2E requires CREEM_DEBUG=true and a test-mode API key'
    );
  }

  console.log(
    'Creem E2E prerequisites (the local Next.js server starts automatically):'
  );
  console.log(`  1. HTTPS tunnel → http://localhost:${port}`);
  console.log(
    `     (for example: cloudflared --config /dev/null tunnel --url http://localhost:${port} --no-autoupdate --protocol quic)`
  );
  console.log(
    '  2. Creem Dashboard Test Mode: webhook → <tunnel>/api/webhooks/creem'
  );
  console.log(
    '     subscribed to checkout.completed, subscription.active, subscription.paid, subscription.update, subscription.scheduled_cancel, subscription.canceled, subscription.expired, subscription.past_due, subscription.unpaid, subscription.trialing, subscription.paused'
  );
  console.log(`Playwright base URL: ${baseURL}`);
  console.log('');

  const playwright = spawn(
    'pnpm',
    [
      'exec',
      'playwright',
      'test',
      '--config',
      'playwright.creem.config.ts',
      ...process.argv.slice(2).filter((argument) => argument !== '--'),
    ],
    {
      env: runtimeEnv,
      stdio: 'inherit',
      cwd: process.cwd(),
    }
  );

  const exitCode = await new Promise<number>((resolveExit, reject) => {
    playwright.once('error', reject);
    playwright.once('exit', (code) => resolveExit(code ?? 1));
  });
  process.exitCode = exitCode;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
