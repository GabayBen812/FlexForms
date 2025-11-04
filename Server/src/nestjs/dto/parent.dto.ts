import { IsString, IsNotEmpty, IsMongoId, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateParentDto {
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
  linked_kids?: string[];

  @IsString()
  @IsOptional()
  address?: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;
}

export class UpdateParentDto {
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
  linked_kids?: string[];

  @IsString()
  @IsOptional()
  address?: string;
}

