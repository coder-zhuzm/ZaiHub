/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-22 20:16:40
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 21:35:57
 */
import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@zaihub/database';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}
  private memoryUsers = new Map<string, { id: string; email: string; password: string; nickname?: string; role: string }>();
  private get useMemory() {
    return !process.env.DATABASE_URL;
  }

  async validateUser(email: string, pass: string) {
    if (this.useMemory) {
      const user = Array.from(this.memoryUsers.values()).find((u) => u.email === email);
      if (!user) return null;
      const match = await bcrypt.compare(pass, user.password);
      if (!match) return null;
      return { id: user.id, email: user.email, nickname: user.nickname ?? undefined, role: user.role };
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const match = await bcrypt.compare(pass, user.password);
    if (!match) return null;
    return { id: user.id, email: user.email, nickname: user.nickname ?? undefined, role: user.role };
  }

  async login(user: { id: string; email: string; nickname?: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: await this.jwt.signAsync(payload) };
  }

  async register(email: string, password: string, nickname?: string) {
    const hash = await bcrypt.hash(password, 10);
    if (this.useMemory) {
      const exists = Array.from(this.memoryUsers.values()).some((u) => u.email === email);
      if (exists) throw new ConflictException('email_exists');
      const id = crypto.randomUUID();
      const created = { id, email, password: hash, nickname, role: 'user' };
      this.memoryUsers.set(id, created);
      return { id: created.id, email: created.email, nickname: created.nickname ?? undefined, role: created.role };
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('email_exists');
    const created = await prisma.user.create({ data: { email, password: hash, nickname } });
    return { id: created.id, email: created.email, nickname: created.nickname ?? undefined, role: created.role };
  }
}