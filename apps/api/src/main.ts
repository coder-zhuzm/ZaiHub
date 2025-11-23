/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-22 16:58:32
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 17:49:35
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const port = Number(process.env.PORT) || 8000;
  await app.listen(port);
  console.log(`API listening on port ${port}`);
}
void bootstrap();
