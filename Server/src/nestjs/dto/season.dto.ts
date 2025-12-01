import { IsString, IsNotEmpty, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateSeasonDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  @IsOptional()
  organizationId!: string;
}

export class UpdateSeasonDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class ReorderSeasonDto {
  @IsNumber()
  @IsNotEmpty()
  newOrder!: number;
}

