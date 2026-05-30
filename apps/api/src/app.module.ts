import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import * as path from 'path';
import { AppController } from './app.controller';
import { UsersController } from './users.controller';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { ModelsModule } from './models/models.module';
import { ConversationsModule } from './conversations/conversations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../../../.env'),
        path.resolve(process.cwd(), '.env'),
        '.env',
      ],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    AiModule,
    ModelsModule,
    ConversationsModule,
  ],
  controllers: [AppController, UsersController],
})
export class AppModule {}
