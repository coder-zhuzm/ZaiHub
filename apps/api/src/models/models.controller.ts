import { Controller, Get, Put, Body, UseGuards, Req, Post, Param, Delete } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ModelsService } from "./models.service";
import { ModelResolver } from "../ai/model-resolver";
import { UpdatePreferredModelDto, CreateModelDto, UpdateModelDto } from "./dto";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@Controller("models")
export class ModelsController {
  constructor(private readonly models: ModelsService, private readonly modelResolver: ModelResolver) {}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async list() {
    return this.models.listSummaries();
  }

  @Get("admin")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  async listAdmin() {
    return this.models.listProviders();
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  async me(@Req() req: any) {
    const preferredModel = await this.models.getPreferredModel(req.user.userId);
    return { preferredModel };
  }

  @Put("me")
  @UseGuards(AuthGuard("jwt"))
  async update(@Req() req: any, @Body() body: UpdatePreferredModelDto) {
    const preferredModel = await this.models.updatePreferredModel(
      req.user.userId,
      body.preferredModel ?? null,
    );
    return { preferredModel };
  }

  @Post()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  async create(@Body() body: CreateModelDto) {
    const created = await this.models.createModel(body);
    if (created?.id) this.modelResolver.clear(created.id);
    return created;
  }

  @Put(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  async updateModel(@Param("id") id: string, @Body() body: UpdateModelDto) {
    const updated = await this.models.updateModel(id, body);
    this.modelResolver.clear(id);
    return updated;
  }

  @Delete(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  async deleteModel(@Param("id") id: string) {
    const r = await this.models.deleteModel(id);
    this.modelResolver.clear(id);
    return r;
  }
}
