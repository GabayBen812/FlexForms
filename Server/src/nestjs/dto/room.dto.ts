import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;
}

export class UpdateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;
} 