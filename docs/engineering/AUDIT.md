# Repository audit — 8 October 2026

## Baseline

The checkout at `7194fd8` had a clean working tree. `npm run build` passed: TypeScript completed and Vite 5.4.21 emitted a 151.29 kB JavaScript bundle (49.59 kB gzip). No test, lint, API, or database command existed. Docker and PostgreSQL tools were not available in this WSL environment.

## What exists

- `src/App.tsx` implements a single screen: create an article or discussion, filter/search by title, summary and tags, select a post, increment its displayed like count, and add a flat comment. All actions are local to one browser.
- `src/types.ts` has two shallow interfaces with display author names, no user IDs, ownership, publication state, or validation schema.
- `src/data/seed.ts` contains three sample posts; `src/lib/storage.ts` reads/writes the entire `crossroad.posts.v2` array in `localStorage` and falls back to seed data on malformed or empty data.
- `src/styles.css` contains a responsive three-column layout and color variables. `vite.config.ts` adjusts the base path for GitHub Pages. `.github/workflows/deploy-pages.yml` builds and publishes the static output.
- The MIT code license and separate CC-BY-NC-SA-4.0 content license exist and must be retained.

## Constraints and risks in the baseline

- `src/App.tsx` owns persistence, filtering, creation, reactions, comments, and rendering. This makes API integration and isolated testing difficult.
- There is no routing, authentication, server validation, permission check, rate limit, moderation, or database. Display names are supplied by the visitor; the “Production-ready” label in `src/App.tsx` is inaccurate.
- Each click increments likes without identity or deduplication. The search excludes body text and authors. Comments have no edit, delete, reply, or pagination.
- The clickable `<article>` in the feed has no keyboard activation. Search has no programmatic label. The three-column composition compresses long article text. Color contrast and keyboard flows have not been measured against WCAG 2.2 AA.
- `src/lib/storage.ts` casts parsed JSON directly to `PostItem[]`; incompatible records can reach rendering and a subsequent save can overwrite old data. Migration must export and validate the old key before any import. No automatic upload is appropriate because old records have no trustworthy owner.
- There were no tests for filtering, validation, storage corruption, creation, comments, or permissions.
- `README.md` and `docs/ROADMAP.md` describe a frontend prototype, but their badges and “modern UI” claim do not establish current deployment or accessibility quality.

## Keep and replace

Keep React, TypeScript strict mode, Vite, the Pages base-path behavior, the licenses, and the seed data as demo content. Replace the single component with routes and a repository boundary. Add a server for identity-bound writes and persistence. Keep demo data explicitly isolated from fullstack data.
