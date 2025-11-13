import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsNumber, IsArray, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  category!: string[];

  @IsEnum(['Cash', 'Credit Card', 'Bank Transfer', 'Check'])
  @IsNotEmpty()
  paymentMethod!: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check';

  @IsString()
  @IsOptional()
  invoicePicture?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;
}

export class UpdateExpenseDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  category?: string[];

  @IsEnum(['Cash', 'Credit Card', 'Bank Transfer', 'Check'])
  @IsOptional()
  paymentMethod?: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check';

  @IsString()
  @IsOptional()
  invoicePicture?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

