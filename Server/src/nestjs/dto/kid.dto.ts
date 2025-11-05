import { IsString, IsNotEmpty, IsMongoId, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateKidDto {
  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @IsDateString()
  @IsNotEmpty()
  birthdate!: string;

  @IsString()
  @IsNotEmpty()
  sex!: string;

  @IsArray()
  @IsOptional()
  linked_parents?: string[];

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;
}

export class UpdateKidDto {
  @IsString()
  @IsOptional()
  firstname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsDateString()
  @IsOptional()
  birthdate?: string;

  @IsString()
  @IsOptional()
  sex?: string;

  @IsArray()
  @IsOptional()
  linked_parents?: string[];

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

