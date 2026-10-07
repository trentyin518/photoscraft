import { expect, test } from '@playwright/test';
import {
  cleanupE2EUsers,
  loginByForm,
  registerE2EUser,
  waitForPaidPayment,
  waitForSubscription,
} from '../fixtures/auth';

test.describe('Waffo sandbox payment', () => {
  let currentUserEmail: string | null = null;

  test.beforeEach(async ({ request }) => {
    currentUserEmail = null;
    await cleanupE2EUsers(request);
  });

  test.afterEach(async ({ request }) => {
    if (currentUserEmail) {
      await waitForPaidPayment(request, currentUserEmail, {
        timeoutMs: 30_000,
      });
    }
    await cleanupE2EUsers(request);
  });

  async function completeHostedCheckout(
    page: import('@playwright/test').Page,
    options: {
      paymentButton: 'Pay' | 'Subscribe';
      billingAssertion: RegExp;
    }
  ) {
    const baseURL = test.info().project.use.baseURL ?? '';
    const billingURL = `${baseURL.replace(/\/$/, '')}/settings/billing`;

    await page.waitForURL(/https:\/\/.*\.waffo\.(ai|com)\//, {
      timeout: 30_000,
    });
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Payment', { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const cardMethod = page.getByRole('button', {
      name: 'Credit/Debit Card',
    });
    await cardMethod.click();
    const cardNumber = page.locator('input[autocomplete="cc-number"]');
    if (!(await cardNumber.isVisible().catch(() => false))) {
      await page.waitForTimeout(1_000);
      await cardMethod.click();
    }
    await expect(cardNumber).toBeVisible({ timeout: 30_000 });
    await page
      .getByRole('button', { name: 'Success', exact: true })
      .first()
      .click();

    const payButton = page.getByRole('button', {
      name: options.paymentButton,
      exact: true,
    });
    await expect(payButton).toBeEnabled();
    await payButton.click();

    const doneLink = page.getByRole('link', { name: 'Done', exact: true });
    await expect(doneLink).toHaveAttribute(
      'href',
      /\/payment\?checkout_id=.*callback=/,
      { timeout: 60_000 }
    );
    await doneLink.click();
    await page.waitForURL(billingURL, { timeout: 60_000 });

    // The current plan must update after the webhook without a hard reload.
    await expect
      .poll(async () => page.locator('body').innerText(), {
        timeout: 60_000,
        intervals: [2_000, 4_000, 8_000],
      })
      .toMatch(options.billingAssertion);
  }

  test('monthly subscription returns to Billing and activates the plan', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);
    currentUserEmail = user.email;
    await loginByForm(page, user);
    await page.goto('/pricing');

    const proCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('heading', { name: 'Pro' }) });
    await proCard.getByRole('button', { name: /Get Started/i }).click();
    await completeHostedCheckout(page, {
      paymentButton: 'Subscribe',
      billingAssertion: /Pro[\s\S]*(Active|Trial)/,
    });

    const subscription = await waitForSubscription(request, user.email);
    expect(subscription?.paymentCount).toBe(1);
    expect(subscription?.subscription).toMatchObject({
      status: 'active',
      interval: 'month',
      cancelAtPeriodEnd: false,
    });
  });

  test('yearly subscription returns to Billing and keeps yearly interval', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);
    currentUserEmail = user.email;
    await loginByForm(page, user);
    await page.goto('/pricing');
    await page.getByRole('radio', { name: 'Yearly', exact: true }).click();

    const proCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('heading', { name: 'Pro' }) });
    await proCard.getByRole('button', { name: /Get Started/i }).click();
    await completeHostedCheckout(page, {
      paymentButton: 'Subscribe',
      billingAssertion: /Pro[\s\S]*(Active|Trial)/,
    });

    const subscription = await waitForSubscription(request, user.email);
    expect(subscription?.paymentCount).toBe(1);
    expect(subscription?.subscription?.interval).toBe('year');
  });

  test('lifetime purchase returns to Billing with lifetime access', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);
    currentUserEmail = user.email;
    await loginByForm(page, user);
    await page.goto('/pricing');

    const lifetimeCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('heading', { name: /Lifetime/i }) });
    await lifetimeCard
      .getByRole('button', { name: /Lifetime Access|Get Lifetime/i })
      .click();
    await completeHostedCheckout(page, {
      paymentButton: 'Pay',
      billingAssertion: /Lifetime/i,
    });
  });
});
