# Payment Module

The template supports Pro subscriptions and one-time Lifetime purchases through
Stripe, Creem, or Waffo. Select the provider with
`NEXT_PUBLIC_PAYMENT_PROVIDER` (default: `stripe`). Plans and prices are defined
in `src/config/website.tsx`.

| Plan | Payment type | Scene |
| --- | --- | --- |
| Pro monthly/yearly | `subscription` | `subscription` |
| Lifetime | `one_time` | `lifetime` |

Free requires no payment. `src/lib/price-plan.ts` validates the selected plan and
price before checkout. Keep disabled plans/prices configured while existing
customers need their billing history and subscriptions recognized.

## Routes and actions

- `/pricing`: plans and checkout buttons.
- `/payment`: payment confirmation and Billing refresh.
- `/settings/billing`: current plan and billing portal.
- `createCheckoutAction`: authenticated checkout with localized return URLs.
- `createPortalAction`: authenticated access to the provider's billing portal.
- `getCurrentPlanAction`: Lifetime, active/trialing subscription, or Free.
- `checkPaymentCompletionAction`: payment polling scoped to the current user.

Actions are in `src/actions/`. The provider interface and factory are in
`src/payment/`; implementations are in `src/payment/provider/`. Payment records
are stored in the shared `payment` table in `src/db/app.schema.ts`.

The checkout action derives the buyer's identity from the session. Client
metadata accepts `promotekit_referral` and `affonso_referral`; Datafast
attribution is read from cookies when enabled. Providers set `planId` and
`priceId` from the validated checkout parameters.

## Provider setup

Create Pro monthly, Pro yearly, and Lifetime products in the selected provider,
then configure the variables in `env.example`:

| Provider | Server credentials | Public price/product IDs |
| --- | --- | --- |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `NEXT_PUBLIC_STRIPE_PRICE_{PRO_MONTHLY,PRO_YEARLY,LIFETIME}` |
| Creem | `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` | `NEXT_PUBLIC_CREEM_PRODUCT_{PRO_MONTHLY,PRO_YEARLY,LIFETIME}` |
| Waffo | `WAFFO_MERCHANT_ID`, `WAFFO_PRIVATE_KEY` | `NEXT_PUBLIC_WAFFO_PRODUCT_{PRO_MONTHLY,PRO_YEARLY,LIFETIME}` |

Apply pending PostgreSQL migrations with `pnpm db:migrate`. Configure the
provider's webhook as `https://your-domain.com/api/webhooks/{provider}`. Each
endpoint verifies signatures and accepts events only for the configured
provider.

### Stripe

Checkout returns through `/payment?session_id={CHECKOUT_SESSION_ID}`.
`checkout.session.completed` creates the payment record; `invoice.paid` marks it
paid. The confirmation page polls that record and refreshes Billing.

Subscription events synchronize the price, billing period, trial, status, and
cancellation. Renewals update the existing subscription row. Customer Portal
supports subscription and payment-method management.

Lifetime payment notifications are sent once on the transition to paid. A full
`charge.refunded` event cancels the matching Lifetime order by invoice or checkout
session. Partial refunds retain access. Replayed paid invoices cannot reactivate
a refunded order.

Invalid signatures receive HTTP 400. Processing failures receive HTTP 500 so
Stripe can retry; only a completed, idempotent handler receives HTTP 200.
Out-of-order `invoice.paid` deliveries use that retry path instead of holding a
request open while waiting for `checkout.session.completed`.

### Creem

Creem uses product IDs for checkout. Set `CREEM_DEBUG=true` for its test API.
Checkout returns to Billing. `checkout.completed` creates the paid Lifetime or
subscription record; `subscription.paid` updates the existing subscription row.
Status events synchronize products, periods, and cancellation. `expired` is
treated as recoverable `past_due` until Creem sends `canceled`, while `unpaid`
suspends access. Customer Portal uses the stored Creem customer ID. Invalid
signatures receive HTTP 400 and processing failures receive HTTP 500.

Creem refund events are not handled automatically. Reconcile refunded purchases
with the local payment and access state.

### Waffo

Waffo hosts its confirmation page and returns through
`/payment?checkout_id=...`. The server-generated order reference is carried by the
webhook so the confirmation page can poll the corresponding payment before
refreshing Billing.

`order.completed` records Lifetime purchases. Subscription activation, renewal,
updates, and cancellation synchronize the subscription row. Product metadata
should contain `priceId`; it takes precedence over checkout metadata when a
subscription changes products.

`refund.succeeded` cancels the payment matched by its payment/order ID. This
applies to any successful refund, including a partial refund. The shared
consumer portal is `https://pancake.waffo.ai/consumer/portal/login`.

Development accepts test events; production accepts production events unless
`WAFFO_DEBUG=true`. Keep the private key server-only. Configure the webhook with
`pnpm waffo:setup -- --url https://your-domain.com/api/webhooks/waffo`; use
`--store STO_xxx` when the merchant has multiple stores.

## Testing

Run `pnpm test:coverage` for provider, webhook-route, checkout, access, and
price-plan unit tests. Local `pnpm e2e` uses a dedicated development server and
should use a disposable PostgreSQL database.
Its signed Stripe webhook tests exercise persistence, payment polling, Billing,
and refunds without contacting Stripe. E2E mode skips mail, newsletter, and
payment notifications.

Use `pnpm e2e:stripe`, `pnpm e2e:creem`, or `pnpm e2e:waffo` with separately
configured provider sandboxes to verify hosted checkout and real webhook delivery.
