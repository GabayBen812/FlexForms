import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  formId!: string;

  @IsString()
  organizationId!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  additionalData?: Record<string, any>;

  @IsOptional()
  @IsString()
  kidId?: string;
}
