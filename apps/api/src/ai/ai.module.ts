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

@Module({
  imports: [PassportModule],
  controllers: [AiController],
})
export class AiModule {}