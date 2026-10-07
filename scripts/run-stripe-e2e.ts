import { existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { loadEnv } from 'vite';
import {
  E2E_BETTER_AUTH_SECRET,
  E2E_STRIPE_WEBHOOK_SECRET,
  E2E_TEST_SECRET,
} from '../tests/e2e/fixtures/test-data';

async function main() {
  const port = Number(process.env.STRIPE_E2E_PORT ?? 3119);
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
  const sourceEnv: Record<string, string> = {};
  const envFile = process.env.STRIPE_ENV_FILE;

  if (envFile) {
    const absoluteEnvFile = resolve(envFile);
    if (!existsSync(absoluteEnvFile)) {
      throw new Error(`STRIPE_ENV_FILE does not exist: ${absoluteEnvFile}`);
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
  const mappedStripeEnv = {
    STRIPE_SECRET_KEY: first(
      process.env.STRIPE_SECRET_KEY,
      sourceEnv.STRIPE_SECRET_KEY,
      currentEnv.STRIPE_SECRET_KEY
    ),
    NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: first(
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
      process.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
      sourceEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
      sourceEnv.VITE_STRIPE_PRICE_PRO_MONTHLY,
      currentEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
      currentEnv.VITE_STRIPE_PRICE_PRO_MONTHLY
    ),
    NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: first(
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
      process.env.VITE_STRIPE_PRICE_PRO_YEARLY,
      sourceEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
      sourceEnv.VITE_STRIPE_PRICE_PRO_YEARLY,
      currentEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
      currentEnv.VITE_STRIPE_PRICE_PRO_YEARLY
    ),
    NEXT_PUBLIC_STRIPE_PRICE_LIFETIME: first(
      process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME,
      process.env.VITE_STRIPE_PRICE_LIFETIME,
      sourceEnv.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME,
      sourceEnv.VITE_STRIPE_PRICE_LIFETIME,
      currentEnv.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME,
      currentEnv.VITE_STRIPE_PRICE_LIFETIME
    ),
  };

  const runtimeEnv: NodeJS.ProcessEnv = {
    ...currentEnv,
    ...sourceEnv,
    ...process.env,
    ...mappedStripeEnv,
    NEXT_PUBLIC_PAYMENT_PROVIDER: 'stripe',
    NEXT_PUBLIC_BASE_URL: baseURL,
    NEXT_PUBLIC_DEMO_WEBSITE: 'true',
    NEXT_PUBLIC_E2E_TEST_MODE: 'true',
    E2E_TEST_SECRET,
    BETTER_AUTH_SECRET: E2E_BETTER_AUTH_SECRET,
    STRIPE_E2E_PORT: String(port),
    PLAYWRIGHT_BASE_URL: baseURL,
  };

  const requiredVariables = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY',
    'NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY',
    'NEXT_PUBLIC_STRIPE_PRICE_LIFETIME',
  ] as const;

  for (const variable of requiredVariables) {
    if (!runtimeEnv[variable]) {
      throw new Error(
        `${variable} is required. Use STRIPE_ENV_FILE to load the MkFast Template .env or set it in the current environment.`
      );
    }
  }

  if (!runtimeEnv.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    throw new Error(
      'Stripe sandbox E2E refuses to run without an sk_test_ key'
    );
  }

  let listener: ChildProcess | undefined;
  let stopped = false;

  const stopListener = () => {
    if (!listener || stopped) return;
    stopped = true;
    listener.kill('SIGINT');
  };

  const sanitizedOutput = (chunk: Buffer) =>
    chunk
      .toString()
      .replace(/whsec_[A-Za-z0-9_]+/g, '[redacted-webhook-secret]');

  const waitForWebhookSecret = (child: ChildProcess) =>
    new Promise<string>((resolveSecret, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for Stripe CLI webhook secret'));
      }, 30_000);
      let settled = false;

      const handleChunk = (chunk: Buffer) => {
        const text = chunk.toString();
        const match = text.match(/whsec_[A-Za-z0-9_]+/);
        process.stdout.write(sanitizedOutput(chunk));
        if (match && !settled) {
          settled = true;
          clearTimeout(timeout);
          resolveSecret(match[0]);
        }
      };

      child.stdout?.on('data', handleChunk);
      child.stderr?.on('data', handleChunk);
      child.once('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      });
      child.once('exit', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(new Error(`Stripe CLI listener exited early with code ${code}`));
      });
    });

  listener = spawn(
    'stripe',
    [
      'listen',
      '--skip-update',
      '--events',
      [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.paid',
        'charge.refunded',
      ].join(','),
      '--forward-to',
      `${baseURL}/api/webhooks/stripe`,
    ],
    {
      env: {
        ...runtimeEnv,
        STRIPE_API_KEY: runtimeEnv.STRIPE_SECRET_KEY,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  process.once('SIGINT', () => {
    stopListener();
    process.exitCode = 130;
  });
  process.once('SIGTERM', () => {
    stopListener();
    process.exitCode = 143;
  });

  try {
    const webhookSecret = await waitForWebhookSecret(listener);
    console.log('Stripe sandbox listener is ready');

    const playwright = spawn(
      'pnpm',
      [
        'exec',
        'playwright',
        'test',
        '--config',
        'playwright.stripe.config.ts',
        ...process.argv.slice(2).filter((argument) => argument !== '--'),
      ],
      {
        env: {
          ...runtimeEnv,
          PLAYWRIGHT_BASE_URL: baseURL,
          STRIPE_E2E_PORT: String(port),
          STRIPE_E2E_WEBHOOK_SECRET: webhookSecret,
        },
        stdio: 'inherit',
      }
    );

    const exitCode = await new Promise<number>((resolveExit, reject) => {
      playwright.once('error', reject);
      playwright.once('exit', (code) => resolveExit(code ?? 1));
    });
    process.exitCode = exitCode;
  } finally {
    stopListener();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
