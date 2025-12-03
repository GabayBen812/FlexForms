import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  dynamicFields?: Record<string, any>;
}

