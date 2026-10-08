FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.34.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile --filter @crossroad/web...
COPY apps/web apps/web
COPY packages/contracts packages/contracts
ARG VITE_DATA_MODE=api
ARG VITE_API_URL=http://localhost:3000
ENV VITE_DATA_MODE=$VITE_DATA_MODE VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @crossroad/contracts build && pnpm --filter @crossroad/web build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
