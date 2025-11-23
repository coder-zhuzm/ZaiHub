/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-23 15:43:35
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 15:44:01
 */
import { IsBoolean, IsOptional, IsString, IsUrl } from "class-validator";
import { IsNotEmpty } from "class-validator";

export class UpdatePreferredModelDto {
  @IsOptional()
  @IsString()
  preferredModel?: string;
}

export class CreateModelDto {
  @IsString()
  @IsNotEmpty()
  modelId!: string;

  @IsString()
  name!: string;

  @IsString()
  platform!: string;

  @IsUrl({ require_tld: false })
  baseURL!: string;

  @IsOptional()
  @IsString()
  apiKey: string;
}

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  modelId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  baseURL?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}