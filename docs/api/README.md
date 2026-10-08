# API

Local base URL: `http://localhost:3000`. Interactive Swagger document: `/docs`. All write bodies are JSON and validated by the schemas in `packages/contracts`. Errors use Nest's HTTP status and JSON error body.

| Method      | Path                                               | Auth           | Behavior                                                          |
| ----------- | -------------------------------------------------- | -------------- | ----------------------------------------------------------------- |
| POST        | `/auth/register`, `/auth/login`                    | No             | Returns user and in-memory access token; sets refresh cookie      |
| POST        | `/auth/refresh`, `/auth/logout`                    | Refresh cookie | Rotates or revokes session                                        |
| GET         | `/auth/me`, `/auth/sessions`                       | Bearer         | Current user and active sessions                                  |
| DELETE      | `/auth/sessions/:id`                               | Bearer         | Revoke an owned session                                           |
| GET         | `/articles?page=1&q=term`                          | No             | Published page of 10; PostgreSQL full text, author and tag search |
| GET         | `/articles/:slug`                                  | No             | Published article                                                 |
| GET         | `/articles/mine`                                   | Bearer         | Up to 50 own articles and drafts                                  |
| POST        | `/articles`                                        | Bearer         | Create draft                                                      |
| PATCH       | `/articles/:id`                                    | Bearer         | Update own draft with `version` optimistic check                  |
| POST        | `/articles/:id/publish`                            | Bearer         | Publish own draft once                                            |
| GET/POST    | `/articles/:slug/comments`                         | POST: Bearer   | Read up to 20 or create comment                                   |
| DELETE      | `/comments/:id`                                    | Bearer         | Soft delete own comment; moderators may delete                    |
| GET         | `/bookmarks`                                       | Bearer         | Up to 50 saved articles                                           |
| POST/DELETE | `/articles/:slug/bookmark`                         | Bearer         | Save or unsave                                                    |
| GET         | `/health/live`, `/health/ready`, `/health/metrics` | No             | Process, database, and in-process request/error/duration metrics  |

A bearer token is `Authorization: Bearer <accessToken>`. Refresh cookies require `credentials: include` and an `Origin` equal to `WEB_ORIGIN` on auth POST requests. The Swagger document currently lists routes but does not yet include all generated response schemas; OpenAPI client generation remains backlog.
