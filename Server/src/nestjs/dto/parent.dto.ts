import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsArray } from 'class-validator';
import { IsValidIsraeliID } from '../../common/decorators/is-valid-israeli-id';

export class CreateParentDto {
  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @IsArray()
  @IsOptional()
  linked_kids?: string[];

  @IsString()
  @IsOptional()
  @IsValidIsraeliID()
  idNumber?: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

export class UpdateParentDto {
  @IsString()
  @IsOptional()
  firstname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsArray()
  @IsOptional()
  linked_kids?: string[];

  @IsString()
  @IsOptional()
  @IsValidIsraeliID()
  idNumber?: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

