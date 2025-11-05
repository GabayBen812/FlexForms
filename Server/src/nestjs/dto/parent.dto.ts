import { IsString, IsNotEmpty, IsMongoId, IsDateString, IsOptional, IsArray } from 'class-validator';
import { IsValidIsraeliID } from '../../common/decorators/is-valid-israeli-id';

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

  @IsString()
  @IsOptional()
  @IsValidIsraeliID()
  idNumber?: string;

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

  @IsString()
  @IsOptional()
  @IsValidIsraeliID()
  idNumber?: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

