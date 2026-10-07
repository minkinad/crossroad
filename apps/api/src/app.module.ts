import { Controller, Get, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ArticleController } from "./article.controller";
import { ArticleService } from "./article.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MetricsService } from "./metrics.service";
import { PrismaService } from "./prisma.service";
import { SocialController } from "./social.controller";
import { SocialService } from "./social.service";

@Controller()
class HealthController {
  constructor(
    private readonly db: PrismaService,
    private readonly metrics: MetricsService,
  ) {}
  @Get("health/live") live() {
    return { status: "ok" };
  }
  @Get("health/metrics")
  metricsSnapshot() {
    return this.metrics.snapshot();
  }
  @Get("health/ready") async ready() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: "ready" };
  }
}
@Module({
  imports: [JwtModule.register({ secret: process.env.SESSION_SECRET })],
  controllers: [
    HealthController,
    AuthController,
    ArticleController,
    SocialController,
  ],
  providers: [
    PrismaService,
    MetricsService,
    AuthService,
    ArticleService,
    SocialService,
  ],
})
export class AppModule {}
