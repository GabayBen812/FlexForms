import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ContactStatus, ContactType } from '../schemas/contact.schema';
import { ContactRelation } from '../schemas/contact-relationship.schema';

type DynamicFields = Record<string, unknown>;

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @IsEnum(ContactType)
  type!: ContactType;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  idNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @IsMongoId()
  @IsOptional()
  accountId?: string;

  @IsOptional()
  @IsObject()
  dynamicFields?: DynamicFields;
}

export class UpdateContactDto {
  @IsString()
  @IsOptional()
  firstname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsEnum(ContactType)
  @IsOptional()
  type?: ContactType;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  idNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @IsMongoId()
  @IsOptional()
  accountId?: string;

  @IsOptional()
  @IsObject()
  dynamicFields?: DynamicFields;
}

export class CreateContactRelationshipDto {
  @IsMongoId()
  @IsNotEmpty()
  sourceContactId!: string;

  @IsMongoId()
  @IsNotEmpty()
  targetContactId!: string;

  @IsEnum(ContactRelation)
  relation!: ContactRelation;

  @IsString()
  @IsOptional()
  note?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateContactRelationshipDto {
  @IsEnum(ContactRelation)
  @IsOptional()
  relation?: ContactRelation;

  @IsString()
  @IsOptional()
  note?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateContactRelationshipForContactDto {
  @IsMongoId()
  @IsNotEmpty()
  targetContactId!: string;

  @IsEnum(ContactRelation)
  relation!: ContactRelation;

  @IsString()
  @IsOptional()
  note?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}


