import { IsString, IsNotEmpty, IsMongoId, IsHexColor, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsMongoId()
  @IsOptional()
  seasonId?: string;
}

export class UpdateCourseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsHexColor()
  @IsOptional()
  color?: string;
}


