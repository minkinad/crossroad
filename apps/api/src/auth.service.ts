import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Role } from "@prisma/client";
import {
  createHash,
  randomBytes,
  scrypt as callbackScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { LoginInput, RegisterInput, UserView } from "@crossroad/contracts";
import { PrismaService } from "./prisma.service";

const scrypt = promisify(callbackScrypt);
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const accessSeconds = 15 * 60;
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
function userView(user: { id: string; handle: string; role: Role }): UserView {
  return { id: user.id, handle: user.handle, role: user.role };
}
async function passwordHash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex || hex.length !== 128) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return timingSafeEqual(actual, expected);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(data: RegisterInput) {
    try {
      const user = await this.db.user.create({
        data: {
          handle: data.handle,
          email: data.email,
          passwordHash: await passwordHash(data.password),
        },
      });
      return this.issue(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException("Handle or email already exists");
      throw error;
    }
  }
  async login(data: LoginInput) {
    const user = await this.db.user.findUnique({
      where: { email: data.email },
    });
    // Same public error for unknown account and wrong password.
    if (!user || !(await verifyPassword(data.password, user.passwordHash)))
      throw new UnauthorizedException("Invalid credentials");
    return this.issue(user);
  }
  private async issue(user: { id: string; handle: string; role: Role }) {
    const token = randomBytes(32).toString("base64url");
    const session = await this.db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + SESSION_MS),
      },
    });
    return {
      user: userView(user),
      accessToken: await this.access(user, session.id),
      refreshToken: `${session.id}.${token}`,
    };
  }
  private access(user: { id: string; role: Role }, sessionId: string) {
    return this.jwt.signAsync(
      { sub: user.id, sid: sessionId },
      { expiresIn: accessSeconds },
    );
  }
  async refresh(raw: string | undefined) {
    const [id, token] = raw?.split(".") ?? [];
    if (!id || !token) throw new UnauthorizedException();
    const session = await this.db.session.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date())
      throw new UnauthorizedException();
    const presentedHash = hashToken(token);
    if (session.tokenHash !== presentedHash) {
      if (
        session.previousTokenHash === presentedHash &&
        session.rotatedAt &&
        Date.now() - session.rotatedAt.getTime() < 5_000
      )
        throw new ConflictException(
          "Refresh already rotated; retry with the current cookie",
        );
      await this.db.session.update({
        where: { id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException();
    }
    const next = randomBytes(32).toString("base64url");
    const changed = await this.db.session.updateMany({
      where: { id, tokenHash: session.tokenHash, revokedAt: null },
      data: {
        tokenHash: hashToken(next),
        previousTokenHash: session.tokenHash,
        rotatedAt: new Date(),
      },
    });
    if (changed.count !== 1) throw new UnauthorizedException();
    return {
      user: userView(session.user),
      accessToken: await this.access(session.user, id),
      refreshToken: `${id}.${next}`,
    };
  }
  async logout(raw: string | undefined) {
    const [id, token] = raw?.split(".") ?? [];
    if (id && token)
      await this.db.session.updateMany({
        where: { id, tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }
  async userFromAccess(token: string): Promise<UserView> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; sid: string }>(
        token,
      );
      const session = await this.db.session.findUnique({
        where: { id: payload.sid },
        include: { user: true },
      });
      if (
        session &&
        session.userId === payload.sub &&
        !session.revokedAt &&
        session.expiresAt > new Date()
      )
        return userView(session.user);
    } catch {
      /* return one consistent auth error */
    }
    throw new UnauthorizedException();
  }
  async sessions(user: UserView) {
    return this.db.session.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
  async revoke(user: UserView, id: string) {
    await this.db.session.updateMany({
      where: { id, userId: user.id },
      data: { revokedAt: new Date() },
    });
  }
}
