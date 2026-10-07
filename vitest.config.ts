import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_PAYMENT_PROVIDER: 'stripe',
      NEXT_PUBLIC_STRIPE_PRICE_LIFETIME: 'price_lifetime_test',
      NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: 'price_pro_monthly_test',
      NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: 'price_pro_yearly_test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/actions/create-checkout-session.ts',
        'src/lib/e2e.ts',
        'src/lib/price-plan.ts',
        'src/lib/urls.ts',
        'src/payment/errors.ts',
        'src/payment/provider/{creem,stripe,waffo}.ts',
        'src/payment/webhook-route.ts',
      ],
      thresholds: {
        branches: 60,
        functions: 90,
        lines: 75,
        statements: 75,
        'src/lib/{e2e,price-plan,urls}.ts': {
          branches: 80,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
});
