FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.34.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile --filter @crossroad/api...
COPY apps/api apps/api
COPY packages/contracts packages/contracts
RUN pnpm --filter @crossroad/contracts build && pnpm --filter @crossroad/api db:generate && pnpm --filter @crossroad/api build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages/contracts ./packages/contracts
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "apps/api/node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
