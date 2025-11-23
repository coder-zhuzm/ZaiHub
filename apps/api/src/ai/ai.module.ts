/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-22 20:46:53
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 20:58:05
 */
import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

@Module({
  imports: [PassportModule],
  controllers: [AiController],
  providers: [PrismaService, AiService],
  exports: [AiService],
})
export class AiModule {}