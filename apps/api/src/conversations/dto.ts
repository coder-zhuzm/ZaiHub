import { IsOptional, IsString } from "class-validator";

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;
}
