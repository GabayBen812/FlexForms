import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsDateString,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType, PaymentType, VatType, Currency, Language } from '../services/greenInvoice.service';

export enum InvoiceDocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  INVOICE_RECEIPT = 'invoiceReceipt',
  CREDIT_NOTE = 'creditNote',
  PROFORMA = 'proforma',
}

// Map string document types to numeric types
export const DocumentTypeMap: Record<InvoiceDocumentType, DocumentType> = {
  [InvoiceDocumentType.INVOICE]: DocumentType.INVOICE,
  [InvoiceDocumentType.RECEIPT]: DocumentType.RECEIPT,
  [InvoiceDocumentType.INVOICE_RECEIPT]: DocumentType.INVOICE_RECEIPT,
  [InvoiceDocumentType.CREDIT_NOTE]: DocumentType.CREDIT_NOTE,
  [InvoiceDocumentType.PROFORMA]: DocumentType.PROFORMA_INVOICE,
};

export enum InvoicePaymentType {
  CASH = 'cash',
  CHECK = 'check',
  CREDIT_CARD = 'creditCard',
  BANK_TRANSFER = 'bankTransfer',
  BIT = 'bit',
}

// Map string payment types to numeric types
export const PaymentTypeMap: Record<InvoicePaymentType, PaymentType> = {
  [InvoicePaymentType.CASH]: PaymentType.CASH,
  [InvoicePaymentType.CHECK]: PaymentType.CHECK,
  [InvoicePaymentType.CREDIT_CARD]: PaymentType.CREDIT_CARD,
  [InvoicePaymentType.BANK_TRANSFER]: PaymentType.BANK_TRANSFER,
  [InvoicePaymentType.BIT]: PaymentType.BIT,
};

export class InvoiceClientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  personalId!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @IsOptional()
  vatType?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class InvoicePaymentDto {
  @IsEnum(InvoicePaymentType)
  @IsNotEmpty()
  type!: InvoicePaymentType;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsEnum(InvoiceDocumentType)
  @IsNotEmpty()
  documentType!: InvoiceDocumentType;

  @ValidateNested()
  @Type(() => InvoiceClientDto)
  @IsNotEmpty()
  client!: InvoiceClientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  @ValidateNested()
  @Type(() => InvoicePaymentDto)
  @IsNotEmpty()
  payment!: InvoicePaymentDto;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(VatType)
  @IsOptional()
  vatType?: VatType;

  @IsString()
  @IsOptional()
  formId?: string;
}

export class UpdateInvoiceDto {
  @ValidateNested()
  @Type(() => InvoiceClientDto)
  @IsOptional()
  client?: InvoiceClientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  @IsOptional()
  items?: InvoiceItemDto[];

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(VatType)
  @IsOptional()
  vatType?: VatType;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class InvoiceQueryDto {
  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}

export class InvoiceStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}

