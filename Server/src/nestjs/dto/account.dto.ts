import { IsNotEmpty, IsOptional, IsString, IsObject, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @Type(() => Types.ObjectId)
  organizationId?: Types.ObjectId | string;

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  linked_contacts?: string[];

  @IsOptional()
  @IsObject()
  dynamicFields?: Record<string, any>;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Types.ObjectId)
  organizationId?: Types.ObjectId | string;

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  linked_contacts?: string[];

  @IsOptional()
  @IsObject()
  dynamicFields?: Record<string, any>;
}

