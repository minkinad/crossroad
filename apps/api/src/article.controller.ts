import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { articleInput } from "@crossroad/contracts";
import type { Request } from "express";
import { z } from "zod";
import { ArticleService } from "./article.service";
import { AuthService } from "./auth.service";
import { bearer, input, pageNumber } from "./http";

@ApiTags("articles")
@Controller("articles")
export class ArticleController {
  constructor(
    private readonly articles: ArticleService,
    private readonly auth: AuthService,
  ) {}
  @Get()
  list(
    @Query("page") page: string | undefined,
    @Query("q") q: string | undefined,
  ) {
    return this.articles.list(pageNumber(page), q);
  }
  @Get("mine")
  @ApiBearerAuth()
  async mine(@Req() request: Request) {
    return this.articles.mine(await this.auth.userFromAccess(bearer(request)));
  }
  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.articles.get(slug);
  }
  @Post()
  @ApiBearerAuth()
  async create(@Req() request: Request, @Body() body: unknown) {
    return this.articles.create(
      await this.auth.userFromAccess(bearer(request)),
      input(articleInput, body),
    );
  }
  @Patch(":id")
  @ApiBearerAuth()
  async update(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = input(
      articleInput.extend({ version: z.number().int().positive() }),
      body,
    );
    return this.articles.update(
      await this.auth.userFromAccess(bearer(request)),
      id,
      parsed,
      parsed.version,
    );
  }
  @Post(":id/publish")
  @ApiBearerAuth()
  async publish(@Req() request: Request, @Param("id") id: string) {
    return this.articles.publish(
      await this.auth.userFromAccess(bearer(request)),
      id,
    );
  }
}
