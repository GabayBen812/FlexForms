import { IsString, IsOptional, IsMongoId} from 'class-validator';
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

@IsMongoId()
@IsOptional() 
organizationId?: string;

  @IsOptional()
  @IsString()
  status: string;

}
