# Architecture overview

```text
Browser (React routes + TanStack Query)
          |
          v
Repository interface ── demo adapter → localStorage crossroad.demo.v3
          |
          └── API adapter → NestJS controllers → services → Prisma → PostgreSQL
                                 ↑
                        shared Zod contracts
```

The mode is chosen once at build time through `VITE_DATA_MODE=demo|api`. Demo writes are scoped to one browser. The API adapter uses credentials for the refresh cookie and an access token held only in memory. Nest controllers parse shared Zod inputs and call services; services enforce ownership and write through Prisma. The migration includes relational constraints and a PostgreSQL full text GIN index.

This first slice has articles, drafts, comments, bookmarks, and accounts. No `packages/ui` or generated API client exists yet because the current component and endpoint surface is small. The concrete gaps are recorded in [roadmap](../product/ROADMAP.md).
