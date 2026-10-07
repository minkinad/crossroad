import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { commentInput } from "@crossroad/contracts";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { bearer, input, pageNumber } from "./http";
import { SocialService } from "./social.service";

@ApiTags("discussion")
@Controller()
export class SocialController {
  constructor(
    private readonly social: SocialService,
    private readonly auth: AuthService,
  ) {}
  @Get("articles/:slug/comments")
  comments(
    @Param("slug") slug: string,
    @Query("page") page: string | undefined,
  ) {
    return this.social.comments(slug, pageNumber(page));
  }
  @Post("articles/:slug/comments")
  @ApiBearerAuth()
  async comment(
    @Req() request: Request,
    @Param("slug") slug: string,
    @Body() body: unknown,
  ) {
    return this.social.comment(
      await this.auth.userFromAccess(bearer(request)),
      slug,
      input(commentInput, body).body,
    );
  }
  @Delete("comments/:id")
  @HttpCode(204)
  @ApiBearerAuth()
  async deleteComment(@Req() request: Request, @Param("id") id: string) {
    return this.social.deleteComment(
      await this.auth.userFromAccess(bearer(request)),
      id,
    );
  }
  @Get("bookmarks")
  @ApiBearerAuth()
  async bookmarks(@Req() request: Request) {
    return this.social.bookmarks(
      await this.auth.userFromAccess(bearer(request)),
    );
  }
  @Post("articles/:slug/bookmark")
  @HttpCode(204)
  @ApiBearerAuth()
  async bookmark(@Req() request: Request, @Param("slug") slug: string) {
    return this.social.bookmark(
      await this.auth.userFromAccess(bearer(request)),
      slug,
      true,
    );
  }
  @Delete("articles/:slug/bookmark")
  @HttpCode(204)
  @ApiBearerAuth()
  async unbookmark(@Req() request: Request, @Param("slug") slug: string) {
    return this.social.bookmark(
      await this.auth.userFromAccess(bearer(request)),
      slug,
      false,
    );
  }
}
