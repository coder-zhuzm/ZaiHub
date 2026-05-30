import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConversationsService } from "./conversations.service";
import { CreateConversationDto, UpdateConversationDto } from "./dto";

@Controller("conversations")
@UseGuards(AuthGuard("jwt"))
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@Req() req: any) {
    return this.conversations.list(req.user.userId);
  }

  @Get(":id")
  get(@Req() req: any, @Param("id") id: string) {
    return this.conversations.get(req.user.userId, id);
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateConversationDto) {
    return this.conversations.create(req.user.userId, body);
  }

  @Patch(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() body: UpdateConversationDto) {
    return this.conversations.update(req.user.userId, id, body);
  }

  @Delete(":id")
  delete(@Req() req: any, @Param("id") id: string) {
    return this.conversations.delete(req.user.userId, id);
  }
}
