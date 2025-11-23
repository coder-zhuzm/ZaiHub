/*
 * @Description:
 * @Author: zhuzm
 * @Date: 2025-11-22 20:16:40
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 20:30:53
 */
import { Injectable, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private prismaService: PrismaService) {}
  private memoryUsers = new Map<
    string,
    {
      id: string;
      email: string;
      password: string;
      nickname?: string;
      role: string;
    }
  >();

  async validateUser(email: string, pass: string) {
    const user = await this.prismaService.client.user.findUnique({ where: { email } });
    if (!user) return null;
    const match = await bcrypt.compare(pass, user.password);
    if (!match) return null;
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname ?? undefined,
      role: user.role,
    };
  }

  async login(user: {
    id: string;
    email: string;
    nickname?: string;
    role: string;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: await this.jwt.signAsync(payload) };
  }

  async register(email: string, password: string, nickname?: string) {
    const hash = await bcrypt.hash(password, 10);
    const exists = await this.prismaService.client.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException("email_exists");
    const created = await this.prismaService.client.user.create({
      data: { email, password: hash, nickname },
    });
    return {
      id: created.id,
      email: created.email,
      nickname: created.nickname ?? undefined,
      role: created.role,
    };
  }
}
