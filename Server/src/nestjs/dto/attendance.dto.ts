import { IsString, IsNotEmpty, IsEmail, IsOptional, IsDateString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UserEmbeddedDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  role?: string;
}

export class CreateAttendanceDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UserEmbeddedDto)
  user!: UserEmbeddedDto;

  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsDateString()
  @IsNotEmpty()
  timestamp!: string;
}


