# Contributing

CrossRoad is being rebuilt in small, finished slices. Open an issue describing the user scenario and its acceptance criteria before a large feature change. Keep API validation, authorization, and database changes together with the interface that uses them.

## Local checks

Use Node.js 22.12+ and pnpm 10.34.4. Run `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, and `pnpm build`. For browser changes also run `pnpm test:e2e`. Document any test you could not run.

Do not include credentials, `.env`, local database files, or generated `dist` output. Keep the existing code and content licenses intact. A pull request should explain the behavior change, validation, migration impact, and screenshots when UI changes.
