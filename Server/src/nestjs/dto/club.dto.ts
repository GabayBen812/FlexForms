import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateClubDto {

    @IsNotEmpty()
    @IsString()
  name!: string;

  @Type(() => Types.ObjectId)
  organizationId!: Types.ObjectId;

  @IsString()
  email!: string;

  @IsString()
  phone!: string;

  
}
