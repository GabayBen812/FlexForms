import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';
import { IsValidIsraeliID } from '../../common/decorators/is-valid-israeli-id';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

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

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  firstname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsString()
  @IsOptional()
  @IsValidIsraeliID()
  idNumber?: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

