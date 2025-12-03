import { IsString, IsNotEmpty, IsMongoId, IsDateString, IsOptional, IsArray } from 'class-validator';
import { IsValidIsraeliID } from '../../common/decorators/is-valid-israeli-id';

export class CreateKidDto {
  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @IsArray()
  @IsOptional()
  linked_parents?: string[];

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @IsValidIsraeliID()
  idNumber?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

export class UpdateKidDto {
  @IsString()
  @IsOptional()
  firstname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @IsArray()
  @IsOptional()
  linked_parents?: string[];

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @IsValidIsraeliID()
  idNumber?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

