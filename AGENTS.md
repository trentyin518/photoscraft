# AGENTS.md

This file provides guidance to Code Agents (Codex, Cursor, etc.) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Production build
- `pnpm e2e` - Run Playwright E2E tests
- `pnpm e2e:stripe` - Run the real Stripe sandbox E2E flow with Stripe CLI
- `pnpm e2e:creem` - Run the real Creem Test Mode E2E flow
- `pnpm e2e:waffo` - Run the real Waffo sandbox E2E flow
- `pnpm e2e:ui` - Open Playwright UI runner
- `pnpm e2e:install` - Install Playwright browsers
- `pnpm lint` - Biome linter (auto-fixes with `--write`)
- `pnpm format` - Biome formatter
- `pnpm db:generate` - Generate Drizzle migration files from schema changes
- `pnpm db:migrate` - Apply pending migrations
- `pnpm db:push` - Push schema directly to DB (dev only)
- `pnpm db:studio` - Open Drizzle Studio GUI
- `pnpm email` - Email template preview server on port 3333
- `pnpm content` - Rebuild fumadocs MDX content collections
- `pnpm knip` - Find unused exports, dependencies, and files
- `pnpm auth:schema:generate` - Regenerate Better Auth schema to `src/db/auth.schema.ts`

Validate changes with `pnpm build`, `pnpm lint`, and targeted manual QA. E2E
coverage exists for critical journeys and should be run locally when changing
auth, protected routes, public routing, profile settings, i18n routing, or shared
layout behavior.

## E2E Testing

- Config: `playwright.config.ts`; specs: `tests/e2e/specs/`; catalog: `tests/e2e/TEST-CATALOG.md`
- Use `Spec -> Code -> Verify -> Test -> Green` proportionally. Do **not** automatically update the catalog or Playwright specs for a small UI, styling, copy, icon, or link change. Prefer focused static checks and, where useful, targeted browser verification without editing test files.
- Update the catalog and add or change Playwright coverage only when the user explicitly asks for tests, an existing test needs repair, or a change materially alters a critical user journey or behavior contract.
- E2E tests validate flows and externally observable state: navigation/redirects, form submission, request results, permissions, persisted data, and enabled/disabled UI state. They do not assert page copy, headings, button labels, toasts, or translations merely to prove rendering.
- For product-owned controls that a journey must operate, add an unlocalized `data-testid` named for the behavior (for example, `auth-login-submit`), then use that selector in the spec. Keep these IDs independent of visible copy. Use form field names, URLs, and response/data assertions where they are already stable. Do not add IDs solely for static content checks.
- Text assertions remain appropriate only when text itself is the product contract (for example, generated content, an email payload, or a legal notice). Third-party hosted-payment field labels belong to their sandbox-provider compatibility tests, not to product-copy checks.
- E2E runs against a dedicated local Next.js server on port `3100` using `.next-e2e`, so it can run while normal `pnpm dev` is using port `3000`.
- E2E mode sets `NEXT_PUBLIC_DEMO_WEBSITE=true`, disables Turnstile with `NEXT_PUBLIC_E2E_TEST_MODE=true`, skips external mail/newsletter side effects, and uses `/api/e2e/users` to clean/verify `e2e-*@example.test` accounts.
- Keep E2E local-first. CI should prefer fast `pnpm lint` and `pnpm build` unless a dedicated E2E environment is explicitly configured.
- Run targeted specs while developing, for example `pnpm e2e -- tests/e2e/specs/auth.spec.ts`; run full `pnpm e2e` before releases or broad refactors.
- Stripe sandbox testing accepts `STRIPE_ENV_FILE=/path/to/mkfast-template/.env pnpm e2e:stripe`; it requires an `sk_test_` key, matching Price IDs, and the Stripe CLI.

## Architecture Overview

### Routing & i18n
- App Router with `[locale]` dynamic segment using `next-intl` (as-needed prefix strategy — default locale omitted from URL)
- Route groups inside `[locale]`: `(marketing)` for public pages, `(protected)` for authenticated pages, `auth` for login/signup, `docs` for documentation
- API routes at `src/app/api/` (outside locale segment)
- Translation files: `messages/en.json`, `messages/zh.json`
- i18n routing config: `src/i18n/routing.ts`; middleware: `src/middleware.ts`

### Authentication (Better Auth)
- Server config: `src/lib/auth.ts`; client: `src/lib/auth-client.ts`
- PostgreSQL adapter via Drizzle, session cached 1 hour, 7-day expiry, fresh age disabled
- Plugins: admin, apiKey, emailHarmony (verification/password reset)
- OAuth: GitHub + Google with account linking
- Auth hooks auto-subscribe new users to newsletter
- Auth tables in `src/db/schema.ts`: `user`, `session`, `account`, `verification`, `apikey`

### Database (Drizzle ORM + PostgreSQL)
- Connection: `src/db/index.ts` using `postgres` driver (not `pg`), singleton pattern
- Schema: `src/db/schema.ts` — auth tables + `payment`
- Payment records track `type` (subscription/one-time), `scene` (lifetime/subscription), `status`; unique constraint on `invoiceId`
- Config: `drizzle.config.ts` reads `DATABASE_URL` from env

### Server Actions (next-safe-action)
- Three-tier action clients in `src/lib/safe-action.ts`:
  - `actionClient` — base, no auth required
  - `userActionClient` — requires authenticated session, ctx includes user/session
  - `adminActionClient` — requires admin role
- All actions use Zod schemas for input validation
- Actions organized by feature in `src/actions/`

### Payment System (Stripe, Creem, Waffo)
- Provider pattern in `src/payment/` with Stripe, Creem, and Waffo implementations
- Plans defined in `src/config/website.tsx`: Free, Pro ($9.90/mo or $99/yr), Lifetime ($199 one-time)
- Webhook handler validates signatures and synchronizes payment status and plan access
- Checkout flow: server action → provider checkout → hosted return → webhook updates the shared payment record
- Plan and price validation: `src/lib/price-plan.ts`; provider setup: `docs/modules/PAYMENT.md`.

### Provider Pattern (used throughout)
All external integrations follow a pluggable provider pattern with factory functions:
- Payment: `src/payment/` (Stripe, Creem, Waffo)
- Mail: `src/mail/` (Resend, React Email templates — all localized)
- Notifications: `src/notification/` (Discord, Feishu)
- Storage: `src/storage/` (S3 via `s3mini`)
- AI: `src/actions/ai/generate-taglines.ts` (OpenAI and DeepSeek tagline demo)

### State & Data Flow
- Server components fetch data directly; mutations via server actions
- Zustand stores in `src/stores/` for client-side state
- React Query for async data on client
- Forms use React Hook Form + Zod validation

### Content
- Fumadocs for documentation (`content/docs/`), MDX blog (`content/blog/`)
- Source config: `source.config.ts`; rebuild with `pnpm content`

### Configuration
- Centralized app config with feature flags: `src/config/website.tsx`
- Demo mode: `NEXT_PUBLIC_DEMO_WEBSITE` env var (enables Crisp chat and Turnstile behavior)
- Environment template: `env.example`

## Code Style

- Biome enforces: 2-space indentation, 80-char line width, single quotes, ES5 trailing commas, semicolons required
- Filenames: kebab-case (`dashboard-sidebar.tsx`); hooks prefixed `use-` (`use-session.ts`)
- Named exports preferred; default exports only for pages/layouts
- Server-only code marked with `"use server"` directive
- Tailwind CSS v4 with tokens in `src/styles/`
- UI primitives from Radix UI; icons from `lucide-react`
- Conventional Commits: `feat:`, `fix:`, `chore:`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
