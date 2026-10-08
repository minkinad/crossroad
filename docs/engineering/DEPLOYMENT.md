# Deployment

## Static demo on GitHub Pages

`.github/workflows/deploy-pages.yml` builds with `VITE_DATA_MODE=demo` and publishes `apps/web/dist`. The Vite base path adjusts to the repository name in GitHub Actions. Pages does not run the NestJS API. Demo UI labels its local persistence and lack of real accounts.

## Local fullstack stack

Create `.env` from `.env.example`, replace both placeholder secrets, then run `docker compose up --build`. The stack defines PostgreSQL, API (port 3000), and web (port 8080). The API applies committed migrations on startup. Persistent database data resides in the named `crossroad_pg` volume. Never use `docker compose down -v` against data you intend to keep.

Docker was unavailable in the development environment, so the image build, health checks, and Compose wiring are configured but **not verified**. Verify them on a host with Docker before a release. Production use should keep the web and API on the same site for the current SameSite refresh cookie. It additionally needs TLS, external secret management, database backups, a shared rate limiter for multiple API instances, and a deployment target. There is no automatic production deployment workflow because no destination has been configured.
