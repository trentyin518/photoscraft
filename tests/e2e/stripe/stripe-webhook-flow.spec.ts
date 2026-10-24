import { expect, test } from '@playwright/test';
import Stripe from 'stripe';
import { createHmac } from 'node:crypto';
import postgres from 'postgres';
import { registerE2EUser, waitForE2EPayment } from '../fixtures/auth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey?.startsWith('sk_test_')) {
  throw new Error('Stripe sandbox tests require an sk_test_ key');
}

const stripe = new Stripe(stripeSecretKey);

function signPayload(payload: string, secret: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret)
    .update(`${ts}.${payload}`)
    .digest('hex');
  return `t=${ts},v1=${signature}`;
}

async function postWebhook(
  baseURL: string,
  payload: string,
  secret: string
): Promise<{ status: number; body: string }> {
  const response = await fetch(`${baseURL}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signPayload(payload, secret),
    },
    body: payload,
  });
  return { status: response.status, body: await response.text() };
}

async function getUserId(email: string): Promise<string> {
  const sql = postgres(process.env.DATABASE_URL as string, {
    prepare: false,
  });
  try {
    const rows = await sql`select id from "user" where email = ${email}`;
    return rows[0]?.id;
  } finally {
    await sql.end();
  }
}

test.describe
  .serial('Stripe application-side webhook flow', () => {
    const customers: string[] = [];
    const subscriptions: string[] = [];

    test.afterAll(async () => {
      for (const id of subscriptions) {
        await stripe.subscriptions.cancel(id).catch(() => {});
      }
      for (const id of customers) {
        await stripe.customers.del(id).catch(() => {});
      }
    });

    test('persists a paid subscription through the real webhook route', async ({
      request,
      baseURL,
    }) => {
      expect(baseURL).toBeTruthy();
      // The app validates against the secret the Stripe CLI generated for this
      // run. The harness exposes it as STRIPE_E2E_WEBHOOK_SECRET.
      const secret = process.env.STRIPE_E2E_WEBHOOK_SECRET;
      expect(secret).toBeTruthy();

      const email = `e2e-webhook-${Date.now()}@example.test`;
      await registerE2EUser(request, { email });
      const userId = await getUserId(email);
      expect(userId).toBeTruthy();

      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '';
      expect(priceId).toMatch(/^price_/);

      const customer = await stripe.customers.create({ email, name: 'E2E' });
      customers.push(customer.id);

      // A real, paid subscription (API confirm bypasses the sandbox hCaptcha
      // that blocks browser automation on this account).
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, planId: 'pro', priceId },
      });
      subscriptions.push(subscription.id);
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const intent = invoice.payment_intent as Stripe.PaymentIntent;
      await stripe.paymentIntents.confirm(intent.id, {
        payment_method: 'pm_card_visa',
      });
      const paid = await stripe.subscriptions.retrieve(subscription.id);
      expect(paid.status).toBe('active');

      // The real invoices.subscription field is nested in newer API versions;
      // read it defensively for the synthetic checkout event.
      const invoiceId = invoice.id;
      const checkoutEvent = {
        id: `evt_manual_checkout_${Date.now()}`,
        object: 'event',
        api_version: '2025-01-27.acacia',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_manual_${Date.now()}`,
            object: 'checkout.session',
            mode: 'subscription',
            customer: customer.id,
            subscription: paid.id,
            invoice: invoiceId,
            metadata: { userId, planId: 'pro', priceId },
          },
        },
      };

      const checkoutResponse = await postWebhook(
        baseURL!,
        JSON.stringify(checkoutEvent),
        secret!
      );
      expect(
        checkoutResponse.status,
        `checkout.session.completed -> ${checkoutResponse.body}`
      ).toBe(200);

      // Replay the real invoice.paid event so the row flips to paid.
      const events = await stripe.events.list({ limit: 100 });
      const invoicePaid = events.data.find(
        (event) =>
          event.type === 'invoice.paid' &&
          JSON.stringify(event.data.object).includes(invoiceId)
      );
      expect(invoicePaid).toBeTruthy();
      const invoicePaidResponse = await postWebhook(
        baseURL!,
        JSON.stringify(invoicePaid),
        secret!
      );
      expect(
        invoicePaidResponse.status,
        `invoice.paid -> ${invoicePaidResponse.body}`
      ).toBe(200);

      const state = await waitForE2EPayment(request, email, {
        paidOnly: true,
        timeoutMs: 30_000,
      });
      expect(state?.latestPayment).toMatchObject({
        paid: true,
        priceId,
        scene: 'subscription',
        status: 'active',
        type: 'subscription',
        interval: 'month',
      });
      expect(state?.latestPayment?.periodEnd).not.toBeNull();

      // invoice.payment_failed must move the subscription to past_due.
      const failedEvent = {
        id: `evt_manual_failed_${Date.now()}`,
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: `in_manual_failed_${Date.now()}`,
            object: 'invoice',
            subscription: paid.id,
            customer: customer.id,
          },
        },
      };
      const failedResponse = await postWebhook(
        baseURL!,
        JSON.stringify(failedEvent),
        secret!
      );
      expect(
        failedResponse.status,
        `invoice.payment_failed -> ${failedResponse.body}`
      ).toBe(200);

      const afterFailure = await waitForE2EPayment(request, email, {
        paidOnly: true,
        timeoutMs: 30_000,
        predicate: (current) => current.latestPayment?.status === 'past_due',
      });
      expect(afterFailure?.latestPayment?.status).toBe('past_due');
    });
  });
