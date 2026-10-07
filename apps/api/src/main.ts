import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { NestFactory } from "@nestjs/core";
import { HttpException, HttpStatus } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pino from "pino";
import type { Request, Response, NextFunction } from "express";
import { MetricsService } from "./metrics.service";
import { AppModule } from "./app.module";

const logger = pino();
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
if (
  !process.env.SESSION_SECRET ||
  Buffer.byteLength(process.env.SESSION_SECRET) < 32
)
  throw new Error("SESSION_SECRET must have at least 32 bytes");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const attempts = new Map<string, { count: number; expires: number }>();
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn"],
  });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  const metrics = app.get(MetricsService);
  app.use((request: Request, response: Response, next: NextFunction) => {
    const id = randomUUID();
    const start = performance.now();
    response.setHeader("X-Request-ID", id);
    response.on("finish", () => {
      const durationMs = Math.round(performance.now() - start);
      metrics.record(response.statusCode, durationMs);
      logger.info(
        {
          requestId: id,
          method: request.method,
          path: request.path,
          status: response.statusCode,
          durationMs,
        },
        "http request",
      );
    });
    // The only cookie-dependent state changes are under /auth.
    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      request.path.startsWith("/auth") &&
      request.header("origin") !== webOrigin
    ) {
      return next(new HttpException("Invalid origin", HttpStatus.FORBIDDEN));
    }
    if (request.path.startsWith("/auth/") && request.method === "POST") {
      const key = `${request.ip}:${request.path}`;
      const now = Date.now();
      const record = attempts.get(key);
      const count = record && record.expires > now ? record.count + 1 : 1;
      attempts.set(key, { count, expires: now + 60_000 });
      if (count > 20)
        return next(
          new HttpException("Too many requests", HttpStatus.TOO_MANY_REQUESTS),
        );
      if (attempts.size > 10_000)
        for (const [entry, item] of attempts)
          if (item.expires <= now) attempts.delete(entry);
    }
    next();
  });
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("CrossRoad API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("/docs", app, document);
  await app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0");
  logger.info({ port: process.env.PORT ?? 3000 }, "api listening");
}
void bootstrap();
