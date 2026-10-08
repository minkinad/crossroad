# Development

Use Node.js 22.12+ and pnpm 10.34.4. Run `pnpm install --frozen-lockfile`. For the static demo run `pnpm dev`. For fullstack mode, create `.env`, run PostgreSQL, `pnpm db:generate`, `pnpm db:migrate`, and `pnpm dev:api`; start web with `pnpm dev:api-web` in another terminal. The root scripts load `.env` into the API, Prisma CLI, and Vite processes. Vite serves port 5173, Nest serves port 3000, and the exact web origin must match `WEB_ORIGIN`.

`packages/contracts` must be built before consuming it from a fresh checkout (`pnpm --filter @crossroad/contracts build`). The root `pnpm build` handles this order. Prisma migrations live in `apps/api/prisma/migrations`; use `pnpm db:migrate` for local development and `pnpm --filter @crossroad/api db:deploy` for deployment.

The old `crossroad.posts.v2` localStorage key remains untouched. The `/data` page exports compatible old records and raw current demo data. Invalid demo data stops writes until it is inspected; the stored value is not overwritten. No import is implemented because ownership is not trustworthy.
