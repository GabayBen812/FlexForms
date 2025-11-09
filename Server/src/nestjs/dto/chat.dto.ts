import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
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


