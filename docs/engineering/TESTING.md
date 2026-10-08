# Testing

- `pnpm test`: Vitest unit tests for contracts, HTTP validation, and demo persistence.
- `pnpm test:integration`: builds the workspace, starts isolated embedded PostgreSQL in a temporary directory, applies the real migration, starts the API, and exercises registration, authorization, version conflict, publication, full text search, comments, bookmarks, and refresh collision handling, replay revocation, and logout revocation. This requires Linux x64 binaries from the development dependency.
- `pnpm test:fullstack`: builds both apps, starts isolated PostgreSQL and the API, then drives registration, publication, comment, bookmark, reload, and logout in Chromium.
- `pnpm test:e2e`: builds demo mode, starts Vite preview, and runs Chromium through publish, comment, bookmark, reload, and search. Playwright may need `pnpm exec playwright install chromium` once locally.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format:check`, `pnpm check:budget`: static gates. The bundle gate caps all emitted JavaScript at 125 kB gzip, CSS at 12 kB gzip, and WOFF2 assets at 120 kB. Lighthouse and Core Web Vitals have not been measured yet.

Integration tests do not yet cover every authorization role, concurrent multi-process rate limiting, or production deployment. The two browser suites cover demo and API-backed paths. Do not infer WCAG or Lighthouse compliance from these tests.
