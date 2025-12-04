import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateChatGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique()
  @IsOptional()
  memberIds?: string[];

  @IsBoolean()
  @IsOptional()
  isReadOnlyForParents?: boolean;
}

export class UpdateChatGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique()
  @IsOptional()
  @ArrayNotEmpty()
  memberIds?: string[];

  @IsBoolean()
  @IsOptional()
  isReadOnlyForParents?: boolean;
}

export class SendChatMessageDto {
  @IsMongoId()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}


