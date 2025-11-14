import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignFeatureFlagsDto {
  @IsArray()
  @IsMongoId({ each: true })
  featureFlagIds!: string[];
}

export class RemoveFeatureFlagDto {
  @IsString()
  @IsMongoId()
  featureFlagId!: string;
}

export class PaymentProviderCredentialsDto {
  @IsString()
  @IsOptional()
  terminalNumber?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;
}

export class InvoicingProviderApiKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey!: string;

  @IsString()
  @IsNotEmpty()
  secret!: string;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  paymentProvider?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentProviderCredentialsDto)
  paymentProviderCredentials?: PaymentProviderCredentialsDto;

  @IsNumber()
  @IsOptional()
  recurringChargeDay?: number;

  @IsString()
  @IsOptional()
  invoicingProvider?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoicingProviderApiKeyDto)
  invoicingProviderApiKey?: InvoicingProviderApiKeyDto;
}
  