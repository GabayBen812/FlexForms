import {
  ArrayNotEmpty,
  IsArray,
  IsHexColor,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTaskColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsHexColor()
  color!: string;
}

export class UpdateTaskColumnDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class ReorderTaskColumnsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  columnIds!: string[];
}

