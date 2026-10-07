import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { loginInput, registerInput } from "@crossroad/contracts";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { bearer, input } from "./http";

const cookieName = "crossroad_refresh";
function setCookie(response: Response, token: string) {
  response.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register")
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(input(registerInput, body));
    setCookie(response, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(input(loginInput, body));
    setCookie(response, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.refresh(request.cookies?.[cookieName]);
    setCookie(response, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }
  @Post("logout")
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(request.cookies?.[cookieName]);
    response.clearCookie(cookieName, { path: "/auth" });
  }
  @Get("me")
  @ApiBearerAuth()
  me(@Req() request: Request) {
    return this.auth.userFromAccess(bearer(request));
  }
  @Get("sessions")
  @ApiBearerAuth()
  async sessions(@Req() request: Request) {
    return this.auth.sessions(await this.auth.userFromAccess(bearer(request)));
  }
  @Delete("sessions/:id")
  @HttpCode(204)
  @ApiBearerAuth()
  async revoke(@Req() request: Request, @Param("id") id: string) {
    return this.auth.revoke(
      await this.auth.userFromAccess(bearer(request)),
      id,
    );
  }
}
