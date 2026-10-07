import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';
import { loadEnv } from 'vite';
import {
  E2E_BETTER_AUTH_SECRET,
  E2E_TEST_SECRET,
} from '../tests/e2e/fixtures/test-data';

async function main() {
  const port = Number(process.env.WAFFO_E2E_PORT ?? 3118);
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
  const envFile = process.env.WAFFO_ENV_FILE;
  const sourceEnv: Record<string, string> = {};

  if (envFile) {
    const absoluteEnvFile = resolve(envFile);
    if (!existsSync(absoluteEnvFile)) {
      throw new Error(`WAFFO_ENV_FILE does not exist: ${absoluteEnvFile}`);
    }
    loadDotenv({ path: absoluteEnvFile, processEnv: sourceEnv });
  }

  const currentEnv = loadEnv('development', process.cwd(), '');
  const mappedWaffoEnv: Record<string, string> = {
    WAFFO_MERCHANT_ID: sourceEnv.WAFFO_MERCHANT_ID ?? '',
    WAFFO_PRIVATE_KEY: sourceEnv.WAFFO_PRIVATE_KEY ?? '',
    NEXT_PUBLIC_WAFFO_PRODUCT_PRO_MONTHLY:
      sourceEnv.NEXT_PUBLIC_WAFFO_PRODUCT_PRO_MONTHLY ??
      sourceEnv.VITE_WAFFO_PRODUCT_PRO_MONTHLY ??
      '',
    NEXT_PUBLIC_WAFFO_PRODUCT_PRO_YEARLY:
      sourceEnv.NEXT_PUBLIC_WAFFO_PRODUCT_PRO_YEARLY ??
      sourceEnv.VITE_WAFFO_PRODUCT_PRO_YEARLY ??
      '',
    NEXT_PUBLIC_WAFFO_PRODUCT_LIFETIME:
      sourceEnv.NEXT_PUBLIC_WAFFO_PRODUCT_LIFETIME ??
      sourceEnv.VITE_WAFFO_PRODUCT_LIFETIME ??
      '',
  };

  const runtimeEnv: NodeJS.ProcessEnv = {
    ...mappedWaffoEnv,
    ...currentEnv,
    ...process.env,
    NEXT_PUBLIC_PAYMENT_PROVIDER: 'waffo',
    NEXT_PUBLIC_BASE_URL: baseURL,
    NEXT_PUBLIC_DEMO_WEBSITE: 'true',
    NEXT_PUBLIC_E2E_TEST_MODE: 'true',
    E2E_TEST_SECRET,
    BETTER_AUTH_SECRET: E2E_BETTER_AUTH_SECRET,
    WAFFO_E2E_PORT: String(port),
    PLAYWRIGHT_BASE_URL: baseURL,
  };

  const requiredVariables = [
    'WAFFO_MERCHANT_ID',
    'WAFFO_PRIVATE_KEY',
    'NEXT_PUBLIC_WAFFO_PRODUCT_PRO_MONTHLY',
    'NEXT_PUBLIC_WAFFO_PRODUCT_PRO_YEARLY',
    'NEXT_PUBLIC_WAFFO_PRODUCT_LIFETIME',
  ] as const;

  for (const variable of requiredVariables) {
    if (!runtimeEnv[variable]) {
      throw new Error(
        `${variable} is required. Use WAFFO_ENV_FILE to load the MkFast Template .env or set it in the current environment.`
      );
    }
  }

  console.log('Waffo E2E prerequisites:');
  console.log(`  - Next dev server: ${baseURL}`);
  console.log(
    '  - Public tunnel: point cloudflared/ngrok at the same port and preserve X-Waffo-Signature'
  );
  console.log(
    '  - Waffo test webhook: <tunnel>/api/webhooks/waffo with order, subscription, and refund events'
  );

  const playwright = spawn(
    'pnpm',
    [
      'exec',
      'playwright',
      'test',
      '--config',
      'playwright.waffo.config.ts',
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
