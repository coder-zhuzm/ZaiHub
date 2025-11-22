/*
 * @Description: prisma client
 * @Author: zhuzm
 * @Date: 2025-11-22 18:14:40
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 21:18:30
 */
import { PrismaClient } from '@prisma/client';

type GlobalPrisma = typeof globalThis & { prisma?: PrismaClient };

const gp = globalThis as GlobalPrisma;

export const prisma = gp.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  gp.prisma = prisma;
}

export { PrismaClient };

export default prisma;