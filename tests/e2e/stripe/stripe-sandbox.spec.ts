import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';
import Stripe from 'stripe';
import {
  cleanupE2EUsers,
  loginByForm,
  registerE2EUser,
  waitForE2EPayment,
  waitForPaidPayment,
} from '../fixtures/auth';
import type { E2EUser } from '../fixtures/test-data';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey?.startsWith('sk_test_')) {
  throw new Error('Stripe sandbox tests require an sk_test_ key');
}

const stripe = new Stripe(stripeSecretKey);

type CheckoutScenario = {
  expectedPlan: 'Lifetime' | 'Pro';
  expectedPriceId: string;
  interval?: 'month' | 'year';
  portalButton?: RegExp;
  cardNumber?: string;
};

type CheckoutArtifacts = {
  subscriptionId?: string;
  sessionId?: string;
  paymentIntentId?: string;
};

async function fillStripeField(page: Page, label: RegExp, value: string) {
  const field = page.getByRole('textbox', { name: label }).first();
  await field.waitFor({ state: 'visible', timeout: 60_000 });
  await field.fill(value);
}

async function cleanupStripeE2ECustomers() {
  for await (const customer of stripe.customers.list({ limit: 100 })) {
    const email = customer.email ?? '';
    if (email.startsWith('e2e-stripe-') && email.endsWith('@example.test')) {
      await stripe.customers.del(customer.id);
    }
  }
}

async function fillStripeCheckout(
  page: Page,
  user: E2EUser,
  scenario: CheckoutScenario
): Promise<Locator> {
  await loginByForm(page, user);
  await page.goto('/pricing');
  await page.waitForLoadState('networkidle');

  if (scenario.interval === 'year') {
    await page.getByRole('radio', { name: 'Yearly', exact: true }).click();
  }

  const planCard = page
    .locator('[data-slot="card"]')
    .filter({
      has: page.getByRole('heading', {
        name: scenario.expectedPlan,
        exact: true,
      }),
    })
    .first();
  const checkoutButtonName =
    scenario.expectedPlan === 'Lifetime'
      ? 'Get Lifetime Access'
      : 'Get Started';
  await planCard
    .getByRole('button', { name: checkoutButtonName, exact: true })
    .click();

  await page.waitForURL(/https:\/\/checkout\.stripe\.com\//, {
    timeout: 60_000,
  });
  const cardNumberField = page
    .getByRole('textbox', { name: /card number/i })
    .first();
  if (!(await cardNumberField.isVisible().catch(() => false))) {
    await page
      .getByRole('button', { name: /pay with card/i })
      .dispatchEvent('click');
  }
  await cardNumberField.waitFor({ state: 'visible', timeout: 60_000 });

  const emailField = page.getByLabel(/email/i).first();
  if ((await emailField.count()) > 0 && (await emailField.isEditable())) {
    await emailField.fill(user.email);
  }
  await fillStripeField(
    page,
    /card number/i,
    scenario.cardNumber ?? '4242424242424242'
  );
  await fillStripeField(page, /expiration|expiry/i, '1230');
  await fillStripeField(page, /security code|cvc/i, '123');

  const nameField = page
    .getByRole('textbox', { name: /cardholder name|name on card/i })
    .first();
  if ((await nameField.count()) > 0 && (await nameField.isEditable())) {
    await nameField.fill(user.name);
  }
  const postalField = page
    .getByRole('textbox', { name: /zip|postal/i })
    .first();
  if ((await postalField.count()) > 0 && (await postalField.isEditable())) {
    await postalField.fill('94107');
  }

  return page
    .getByRole('button', { name: /^(subscribe|pay|complete order)$/i })
    .first();
}

async function completeStripeCheckout(
  page: Page,
  user: E2EUser,
  scenario: CheckoutScenario
): Promise<CheckoutArtifacts> {
  const payButton = await fillStripeCheckout(page, user, scenario);
  await payButton.click();
  await page.waitForURL(/\/settings\/billing/, { timeout: 120_000 });

  const billingCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Current Plan' })
    .first();
  await expect(
    billingCard.getByText(scenario.expectedPlan, { exact: true })
  ).toBeVisible({ timeout: 60_000 });

  const customers = await stripe.customers.list({
    email: user.email,
    limit: 10,
  });
  expect(customers.data).toHaveLength(1);
  const customer = customers.data[0];
  if (!customer || ('deleted' in customer && customer.deleted)) {
    throw new Error(`Stripe customer was not found for ${user.email}`);
  }

  const artifacts: CheckoutArtifacts = {};
  if (scenario.interval) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });
    expect(subscriptions.data).toHaveLength(1);
    expect(subscriptions.data[0]?.items.data[0]?.price.id).toBe(
      scenario.expectedPriceId
    );
    artifacts.subscriptionId = subscriptions.data[0]?.id;
  } else {
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 10,
      status: 'complete',
    });
    expect(sessions.data).toHaveLength(1);
    const lineItems = await stripe.checkout.sessions.listLineItems(
      sessions.data[0].id,
      { limit: 10 }
    );
    expect(lineItems.data[0]?.price?.id).toBe(scenario.expectedPriceId);
    artifacts.sessionId = sessions.data[0].id;
    const paymentIntent = sessions.data[0].payment_intent;
    if (typeof paymentIntent === 'string') {
      artifacts.paymentIntentId = paymentIntent;
    }
  }

  if (scenario.portalButton) {
    await billingCard
      .getByRole('button', { name: scenario.portalButton })
      .click();
    await page.waitForURL(/https:\/\/billing\.stripe\.com\//, {
      timeout: 60_000,
    });
  }

  return artifacts;
}

async function waitForPaidSnapshot(request: APIRequestContext, email: string) {
  const state = await waitForE2EPayment(request, email, {
    paidOnly: true,
    predicate: (current) => current.latestPayment?.paid === true,
  });
  if (!state?.latestPayment) {
    throw new Error(`No paid Stripe payment row found for ${email}`);
  }
  expect(state.paymentCount).toBe(1);
  return state;
}

test.describe
  .serial('Stripe sandbox payment flows', () => {
    const paidEmails = new Set<string>();

    test.beforeAll(async ({ request }) => {
      await cleanupStripeE2ECustomers();
      await cleanupE2EUsers(request);
    });

    test.afterEach(async ({ request }) => {
      for (const email of paidEmails) {
        await waitForPaidPayment(request, email, { timeoutMs: 30_000 });
      }
      paidEmails.clear();
      await cleanupE2EUsers(request);
    });

    test.afterAll(async () => {
      await cleanupStripeE2ECustomers();
    });

    test('completes a monthly subscription and opens Customer Portal', async ({
      page,
      request,
    }) => {
      const user = await registerE2EUser(request, {
        email: `e2e-stripe-month-${Date.now()}@example.test`,
      });
      paidEmails.add(user.email);

      await completeStripeCheckout(page, user, {
        expectedPlan: 'Pro',
        expectedPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
        interval: 'month',
        portalButton: /manage subscription/i,
      });
      const state = await waitForPaidSnapshot(request, user.email);
      expect(state.latestPayment).toMatchObject({
        interval: 'month',
        paid: true,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
        scene: 'subscription',
        status: 'active',
        type: 'subscription',
      });
      expect(state.latestPayment?.periodEnd).not.toBeNull();
    });

    test('completes a yearly subscription', async ({ page, request }) => {
      const user = await registerE2EUser(request, {
        email: `e2e-stripe-year-${Date.now()}@example.test`,
      });
      paidEmails.add(user.email);

      await completeStripeCheckout(page, user, {
        expectedPlan: 'Pro',
        expectedPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? '',
        interval: 'year',
      });
      const state = await waitForPaidSnapshot(request, user.email);
      expect(state.latestPayment).toMatchObject({
        interval: 'year',
        paid: true,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
        scene: 'subscription',
        status: 'active',
        type: 'subscription',
      });
      expect(state.latestPayment?.periodEnd).not.toBeNull();
    });

    test('completes a one-time lifetime payment', async ({ page, request }) => {
      const user = await registerE2EUser(request, {
        email: `e2e-stripe-lifetime-${Date.now()}@example.test`,
      });
      paidEmails.add(user.email);

      const artifacts = await completeStripeCheckout(page, user, {
        expectedPlan: 'Lifetime',
        expectedPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME ?? '',
      });
      const state = await waitForPaidSnapshot(request, user.email);
      expect(state.latestPayment).toMatchObject({
        paid: true,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME,
        scene: 'lifetime',
        status: 'completed',
        type: 'one_time',
      });
      expect(state.latestPayment?.sessionId).toBe(artifacts.sessionId);
    });

    test('rejects a declined card without creating a paid payment row', async ({
      page,
      request,
    }) => {
      const user = await registerE2EUser(request, {
        email: `e2e-stripe-declined-${Date.now()}@example.test`,
      });

      const payButton = await fillStripeCheckout(page, user, {
        expectedPlan: 'Pro',
        expectedPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
        interval: 'month',
        cardNumber: '4000000000009995',
      });
      await payButton.click();
      await expect(page.getByText(/declined/i).first()).toBeVisible({
        timeout: 60_000,
      });

      const state = await waitForE2EPayment(request, user.email, {
        timeoutMs: 10_000,
      });
      expect(state?.paymentCount ?? 0).toBe(0);
    });

    test('persists subscription cancellation and deletion webhook state', async ({
      page,
      request,
    }) => {
      const user = await registerE2EUser(request, {
        email: `e2e-stripe-cancel-${Date.now()}@example.test`,
      });
      paidEmails.add(user.email);

      const artifacts = await completeStripeCheckout(page, user, {
        expectedPlan: 'Pro',
        expectedPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
        interval: 'month',
      });
      if (!artifacts.subscriptionId) {
        throw new Error('Stripe subscription id was not returned');
      }

      await stripe.subscriptions.update(artifacts.subscriptionId, {
        cancel_at_period_end: true,
      });
      const scheduled = await waitForE2EPayment(request, user.email, {
        paidOnly: true,
        predicate: (state) => state.subscription?.cancelAtPeriodEnd === true,
      });
      expect(scheduled?.subscription).toMatchObject({
        cancelAtPeriodEnd: true,
        status: 'active',
      });

      await stripe.subscriptions.cancel(artifacts.subscriptionId);
      const canceled = await waitForE2EPayment(request, user.email, {
        paidOnly: true,
        predicate: (state) => state.subscription?.status === 'canceled',
      });
      expect(canceled?.subscription?.status).toBe('canceled');
    });

    test('revokes lifetime access after a full Stripe refund', async ({
      page,
      request,
    }) => {
      const user = await registerE2EUser(request, {
        email: `e2e-stripe-refund-${Date.now()}@example.test`,
      });
      paidEmails.add(user.email);

      const artifacts = await completeStripeCheckout(page, user, {
        expectedPlan: 'Lifetime',
        expectedPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME ?? '',
      });
      if (!artifacts.sessionId) {
        throw new Error('Stripe lifetime session id was not returned');
      }

      const session = await stripe.checkout.sessions.retrieve(
        artifacts.sessionId
      );
      const paymentIntentId =
        artifacts.paymentIntentId ??
        (typeof session.payment_intent === 'string'
          ? session.payment_intent
          : undefined);
      if (!paymentIntentId) {
        throw new Error('Stripe payment intent id was not returned');
      }

      await stripe.refunds.create({ payment_intent: paymentIntentId });
      paidEmails.delete(user.email);
      const refunded = await waitForE2EPayment(request, user.email, {
        predicate: (state) => state.latestPayment?.paid === false,
      });
      expect(refunded?.paymentCount).toBe(1);
      expect(refunded?.latestPayment).toMatchObject({
        paid: false,
        scene: 'lifetime',
        status: 'canceled',
        type: 'one_time',
      });
    });
  });
