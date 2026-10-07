# PhotoCraft

AI-driven photo editor: enhance blurry photos, restore and colorize old photos,
remove watermarks and backgrounds — 16 one-click AI tools, results in seconds.

- Website: [photoscraft.top](https://photoscraft.top)
- Stack: Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM, Better-Auth, Stripe/Creem
- AI: fal.ai (`FAL_KEY`), Storage: S3-compatible (`STORAGE_*`), Mail: Resend

## Develop

```bash
pnpm install
pnpm db:generate && pnpm db:push
pnpm dev
```

Copy `.env` from `env.example` and fill in `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`RESEND_API_KEY`, `FAL_KEY`, and the `STORAGE_*` variables.
