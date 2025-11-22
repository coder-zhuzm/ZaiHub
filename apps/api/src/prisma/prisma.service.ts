/*
 * @Author: zhuzm
 * @Date: 2025-11-22 20:16:20
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 21:09:42
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@zaihub/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client = prisma;
  async onModuleInit() {
    if (process.env.DATABASE_URL) {
      await prisma.$connect();
    }
  }

  async onModuleDestroy() {
    if (process.env.DATABASE_URL) {
      await prisma.$disconnect();
    }
  }
  isAvailable() {
    return !!process.env.DATABASE_URL;
  }
}