import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignFeatureFlagsDto {
  @IsArray()
  @IsMongoId({ each: true })
  featureFlagIds!: string[];
}

export class RemoveFeatureFlagDto {
  @IsString()
  @IsMongoId()
  featureFlagId!: string;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
  