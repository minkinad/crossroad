# Product and engineering roadmap

The first slice is shipped in code: demo reading/writing and API-backed registration → draft → publish → comment → bookmark → search. The following work is prioritized; each item is complete only when its browser flow, API authorization, migration, and tests pass.

## P0 — Finish the publishing core

- **Docker smoke test.** Build a fresh Compose stack, apply migrations, and exercise the browser path against its API and database on a Docker host. The isolated non-Docker fullstack browser test is already in CI.
- **Rich text content model and editor.** Define a bounded JSON document schema, safe renderer, links, headings, lists, code, image upload policy, autosave, preview, and revision history. Reject malformed nodes on the server.
- **Discussion depth.** Add comment edit/delete UI, replies with bounded depth, reactions, pagination controls, duplicate submission protection, and report flow; test ownership and moderation.
- **Profile and settings.** Add profile data, public author pages, session management UI, and account recovery policy.

## P1 — Discovery and community

- **Follows, tags, and feeds.** Explicit interests and author follows with indexed queries and complete empty states.
- **Transparent ranking.** Separate a freshness/engagement/interest scoring service, cap repeated activity, publish the formula, and unit test edge cases. No ML claim.
- **Communities, collections, and notifications.** Membership and topic feeds, named bookmark collections, read state, response notifications, and delivery controls.
- **Moderation and author dashboard.** Reports, moderator queue, audit trail, role checks, appeal policy, abuse tests, and author statistics derived from real events.

## P2 — Production hardening

- Generated OpenAPI client and complete Swagger schemas; API contract tests.
- Shared rate limiting, structured error envelopes, request metrics dashboard, secret rotation, backup and restore drill.
- Measured Lighthouse/Core Web Vitals, API latency budgets, and image optimization. JavaScript/CSS/font bundle budgets and route splitting are already checked.
- WCAG 2.2 AA audit, automated accessibility checks, keyboard and screen reader review.
- Additional integration and E2E negative cases, load tests, deployment pipeline for a chosen host.
