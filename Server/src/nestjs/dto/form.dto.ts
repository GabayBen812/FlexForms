import { IsString, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateFormDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  paymentSum?: number | undefined;

  @Type(() => Types.ObjectId)
  organizationId!: Types.ObjectId;

  @IsOptional()
  @Type(() => Types.ObjectId)
  seasonId?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  fields: Record<string, any>[] = [];

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  code?: number;

  @IsOptional()
  @IsString()
  backgroundColor?: string;
}
