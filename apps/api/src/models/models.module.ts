import { Module } from "@nestjs/common";
import { ModelsController } from "./models.controller";
import { ModelsService } from "./models.service";
import { PrismaService } from "../prisma/prisma.service";
import { AiModule } from "../ai/ai.module";
import { RolesGuard } from "../auth/roles.guard";

@Module({
  imports: [AiModule],
  controllers: [ModelsController],
  providers: [ModelsService, PrismaService, RolesGuard],
  exports: [ModelsService],
})
export class ModelsModule {}
