# E2E Test Catalog

This catalog is the acceptance checklist for Playwright E2E coverage. Update it
before or alongside feature work, then use the implemented spec files to lock in
the verified behavior.

## Workflow

Use the local feature flow:

```txt
Spec -> Code -> Verify -> Test -> Green
```

Use this workflow when a change alters a critical user journey, fixes an E2E
test, or explicitly requires new coverage. Do not update this catalog or its
specs for a copy-only or small presentational change.

1. Spec: add or update the relevant behavior journey in this catalog.
2. Code: implement the feature.
3. Verify: run the app and walk the real UI in a browser.
4. Test: add or update the matching Playwright spec using behavior-oriented
   selectors and state assertions.
5. Green: run the related spec locally; run full E2E before releases or large
   refactors.

Flow tests assert navigation, requests, permissions, persisted state, and UI
state. They must not use page copy, headings, button labels, toasts, or
translations as their contract unless text itself is the feature under test.

E2E tests are intentionally local-first. CI should continue to prefer fast
checks such as `pnpm lint` and `pnpm build` unless a separate E2E environment is
explicitly provisioned.

## Test Harness

- Config: `playwright.config.ts`
- Specs: `tests/e2e/specs/`
- Fixtures: `tests/e2e/fixtures/`
- Test-only API: `src/app/api/e2e/users/route.ts`

The test-only API is disabled unless Next.js is running locally in development
with `E2E_TEST_SECRET=mksaas-e2e-secret` and the request includes the configured
`x-e2e-secret` header. Test accounts must use the `e2e-*@example.test` email
pattern so cleanup stays scoped.

## 1. Public Page Smoke Test

**File:** `specs/public-pages.spec.ts` | **Priority:** P0

Verifies that public pages render in English/Chinese and dark/light mode without
browser console errors or page errors.

| # | Test name | Flow |
|---|---|---|
| 1 | Public pages render successfully | Open `/`, `/pricing`, `/blog`, `/blog/what-is-fumadocs`, `/docs`, `/ai`, `/about`, `/contact`, `/changelog`, `/roadmap`, `/waitlist`, `/cookie`, `/privacy`, `/terms`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` for `en` and `zh`, in `dark` and `light` mode. Verify each returns 2xx, renders a visible body, applies the requested theme, and emits no browser errors. |
| 2 | Home login modal opens | Open `/`, click the navbar login button, verify the login dialog and credential inputs are visible, and assert no browser errors. |
| 3 | Health check responds with pong | Call `/api/ping` and verify `{ "message": "pong" }`. |
| 4 | Locale switch preserves navigation state | Open the English home page with a query string and hash in dark mode, switch to Chinese through the public language menu, and verify the locale, query string, hash, and theme survive a full navigation without browser errors. |
| 5 | Docs sidebar controls keep the compact layout | Open `/docs` on desktop and verify the social links, language switch, and theme switch share one row, with social links on the left and circular bordered language/theme controls on the right. |

## 2. Authentication And Protected Routes

**File:** `specs/auth.spec.ts` | **Priority:** P0

Verifies login and route protection with real Better Auth endpoints and seeded
verified users.

| # | Test name | Flow |
|---|---|---|
| 1 | Guests are redirected from dashboard | Open `/dashboard` while signed out, expect redirect to `/auth/login`, and verify the credential form is available. |
| 2 | Verified user can sign in | Create an E2E user, mark it verified, sign in through `/auth/login`, and verify the dashboard route and app shell. |
| 3 | User can register from UI | Submit `/auth/register`, mark the test account verified, then sign in through `/auth/login` and reach the dashboard. |
| 4 | Non-admin cannot view users dashboard | Sign in as a regular user, open `/admin/users`, verify the not-found state, and confirm the admin link is absent. The protected-page smoke test separately verifies an admin can render the page. |
| 5 | User can change password | Sign in, update the password through `/settings/security`, clear the browser session, and verify the new password signs in successfully. |

## 3. Protected Page Smoke Test

**File:** `specs/protected-pages.spec.ts` | **Priority:** P0

Verifies authenticated app pages render in English/Chinese and dark/light mode
without browser console errors or page errors.

| # | Test name | Flow |
|---|---|---|
| 1 | Protected pages render successfully | Sign in as an admin E2E user, then open `/dashboard`, `/admin/users`, `/settings/profile`, `/settings/security`, `/settings/apikeys`, `/settings/billing`, `/settings/notifications`, `/payment` for `en` and `zh`, in `dark` and `light` mode. Verify each returns 2xx, renders a visible body, applies the requested theme, and emits no browser errors. |

## 4. Profile Settings

**File:** `specs/settings-profile.spec.ts` | **Priority:** P1

Verifies the signed-in profile update flow.

| # | Test name | Flow |
|---|---|---|
| 1 | User can update display name | Sign in, open `/settings/profile`, change the name, submit, and reload to verify persistence. |

## 5. API Key Lifecycle

**File:** `specs/settings-apikeys.spec.ts` | **Priority:** P0

Verifies API keys through the authenticated settings UI and the public
verification endpoint.

| # | Test name | Flow |
|---|---|---|
| 1 | User can create, verify, and revoke an API key | Sign in, create a named key through `/settings/apikeys`, capture the one-time value, verify it through `/api/test/apikey`, revoke it through the settings table, and verify the revoked key is rejected. |

## 6. Stripe Webhook Boundary

**File:** `specs/payment-webhook.spec.ts` | **Priority:** P0

Verifies the public Stripe webhook boundary using locally signed Stripe events
without contacting Stripe.

| # | Test name | Flow |
|---|---|---|
| 1 | Lifetime checkout completes and refreshes Billing | Reject missing and invalid signatures, process signed checkout and paid-invoice events twice, assert one persisted Lifetime payment, and verify polling transitions to success before Billing resolves the Lifetime plan. |
| 2 | Refund and payment ownership | Pay two orders for the same customer, refund one by invoice, replay its paid invoice, and assert only that order is canceled. Verify the other order succeeds for its owner and reports unpaid when another user polls it. |
| 3 | Unknown checkout price | Submit a signed checkout event for an unknown price, assert a retryable 5xx response, and verify no payment is created. |
| 4 | Out-of-order invoice recovery | Deliver `invoice.paid` before checkout completion and assert a retryable 5xx response, then deliver checkout completion and replay the invoice to verify one paid Lifetime row. |

## 7. Stripe Hosted Checkout

**File:** `stripe/stripe-sandbox.spec.ts` | **Priority:** P0

Verifies the real Stripe test-mode checkout, Customer Portal, subscription
lifecycle, declined cards, and refund entitlement behavior. Run it with
`STRIPE_ENV_FILE=/path/to/mkfast-template/.env pnpm e2e:stripe`; the helper
starts Stripe CLI and forwards webhook events to the isolated local server.

| # | Test name | Flow |
|---|---|---|
| 1 | Monthly subscription and Customer Portal | Register and sign in, complete the monthly Pro checkout with the success card, assert the persisted subscription row, and open Stripe Customer Portal. |
| 2 | Yearly subscription | Complete the yearly Pro checkout and assert the persisted yearly interval and price ID. |
| 3 | Lifetime payment | Complete the one-time Lifetime checkout and assert the paid lifetime row and checkout session correlation. |
| 4 | Declined card | Submit Stripe's declined test card and verify no paid payment row is created. |
| 5 | Subscription cancellation | Schedule cancellation, then cancel the subscription and verify both webhook states. |
| 6 | Full Lifetime refund | Refund the PaymentIntent through Stripe and verify `charge.refunded` revokes the local Lifetime entitlement. |

The suite is serial and removes only `e2e-stripe-*` Stripe customers. Payment
rows are polled before deleting E2E users so asynchronous webhook delivery does
not race with foreign-key cleanup.

## 8. Waffo Hosted Checkout

**File:** `waffo/waffo-sandbox.spec.ts` | **Priority:** P0

Verifies the real Waffo sandbox checkout and webhook-backed entitlement flow.
Run it with `WAFFO_ENV_FILE=/path/to/mkfast-template/.env pnpm e2e:waffo` after
starting a public tunnel and registering the test webhook.

| # | Test name | Flow |
|---|---|---|
| 1 | Monthly subscription returns to Billing | Register and sign in, purchase the monthly Pro product through Waffo hosted checkout using the sandbox Success card, click Waffo's `Done` link, wait for `/payment?checkout_id=...` to poll the webhook-backed row, and verify Billing shows the active Pro plan without a hard reload. |
| 2 | Yearly subscription preserves interval | Repeat the hosted flow with the Yearly selector and assert the persisted subscription interval is `year`. |
| 3 | Lifetime purchase grants access | Purchase the Lifetime product, complete the hosted return flow, and verify Billing shows Lifetime access. |

The test waits for the paid payment row before deleting the E2E user because
Waffo webhook delivery is asynchronous and the payment table has a foreign-key
reference to the user.

## 9. Creem Hosted Checkout

**File:** `creem/creem-sandbox.spec.ts` | **Priority:** P1

Verifies the real Creem Test Mode hosted checkout and webhook-backed payment
state. Run it with `pnpm e2e:creem`; use `CREEM_ENV_FILE=/path/to/.env` when
the sandbox credentials are stored in a separate environment file.

| # | Test name | Flow |
|---|---|---|
| 1 | Monthly subscription | Register and sign in, complete the Creem hosted monthly checkout, return to Billing, and verify the active Pro plan plus the monthly product in the local E2E payment API. |
| 2 | Yearly subscription | Select yearly pricing, complete the hosted checkout, and verify the active yearly subscription and product. |
| 3 | Lifetime payment | Complete the hosted one-time checkout and verify a completed Lifetime payment row. |
| 4 | Declined card | Submit Creem's declined test card and verify the checkout fails without a paid local payment row. |
| 5 | Scheduled cancellation | Cancel the created test subscription through Creem's official SDK/API and verify the `subscription.scheduled_cancel` webhook sets `cancelAtPeriodEnd` while the subscription remains active. |

### Prerequisites

`pnpm e2e:creem` starts the local Next.js server automatically. Before a paid
flow, expose the configured local port (default `3120`) through an HTTPS tunnel
and register `<tunnel>/api/webhooks/creem` in Creem Test Mode. Subscribe the
webhook to `checkout.completed`, `subscription.active`, `subscription.paid`,
`subscription.scheduled_cancel`, `subscription.canceled`, `subscription.expired`,
`subscription.past_due`, `subscription.trialing`, and `subscription.paused`.

Set `CREEM_DEBUG=true`, `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, and the three
`NEXT_PUBLIC_CREEM_PRODUCT_*` Test Mode product IDs. The successful card is
`4242 4242 4242 4242`; the declined card is `4000 0000 0000 0002`. Webhook
delivery is asynchronous, so the suite waits for the local E2E payment API
before deleting each test user.

The suite intentionally does not cover renewal time travel, refunds, or the
Creem email-based customer portal flow.

## 10. Production Build Smoke Test

**File:** `production/production-smoke.spec.ts` | **Priority:** P0

Verifies the built Next.js application instead of the development server. Run
it with `pnpm e2e:production`.

| # | Test name | Flow |
|---|---|---|
| 1 | Production build serves pages and APIs | Build into an isolated Next.js output directory, start `next start`, render representative public pages, verify guest dashboard redirect and `/api/ping`, and confirm the development-only E2E cleanup endpoint returns 404. |

## Deferred Coverage

These flows should be added after their dependencies are made deterministic:

| Area | Reason |
|---|---|
| Creem renewal, refund, and customer portal flows | Renewal time travel, refunds, and the email-based portal need separate deterministic fixtures. |
| Storage uploads | Requires deterministic local storage assertions and small fixture files. |
| Transactional email | Requires a fake mail provider or captured verification links. |
| AI tools | Requires provider mocks or stable fake responses to avoid cost and flake. |
