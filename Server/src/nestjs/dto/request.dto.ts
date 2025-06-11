import { IsString, IsOptional} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateRequestDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;

  @IsOptional()
  type?: string;

  @Type(() => Types.ObjectId)
  organizationId!: Types.ObjectId;

  @IsOptional()
  @IsString()
  status: string;

}
