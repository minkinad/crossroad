# Security policy

Please report vulnerabilities privately using the repository's GitHub **Security → Report a vulnerability** flow when available. If that flow is unavailable, contact the maintainers privately before disclosing details. Do not open a public exploit report first.

Supported scope is the current `main` branch. The demo stores only local browser data; the API handles real accounts and must be deployed with HTTPS, an exact `WEB_ORIGIN`, a random `SESSION_SECRET`, and a managed PostgreSQL backup policy. See [deployment](docs/engineering/DEPLOYMENT.md).

The dependency audit on 2026-10-08 (`pnpm audit --audit-level=moderate`) reported no known advisories. The present release has known gaps: no distributed rate limiter, no automated accessibility or load budget gate, and no formal external security review. These are tracked in the roadmap.
