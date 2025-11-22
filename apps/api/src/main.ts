import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  let port = Number(process.env.PORT) || 8000;
  while (true) {
    try {
      await app.listen(port);
      console.log(`API listening on port ${port}`);
      break;
    } catch (e: any) {
      if (e && e.code === 'EADDRINUSE') {
        port += 1;
        continue;
      }
      throw e;
    }
  }
}
void bootstrap();
