import { IsString, IsOptional, IsBoolean, IsArray, IsObject, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeatureFlagDto {
  @IsString()
  @Matches(/^ff_[a-z0-9_]+$/, {
    message: 'Key must start with ff_ and contain only lowercase letters, numbers, and underscores'
  })
  key!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateFeatureFlagDto {
  @IsString()
  @IsOptional()
  @Matches(/^ff_[a-z0-9_]+$/, {
    message: 'Key must start with ff_ and contain only lowercase letters, numbers, and underscores'
  })
  key?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 