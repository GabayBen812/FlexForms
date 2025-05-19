import { IsString, IsOptional, IsArray, IsNotEmpty, IsDateString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateClubDto {

  @IsOptional()
  @IsString()
  clubName?: string;

  @IsOptional()
  @Type(() => Types.ObjectId)
  organizationId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

   @IsOptional()
  @IsString()
  clubNumber?: string;

  @IsOptional()
  @IsString()
  clubEstablished?: string;

  @IsOptional()
  @IsString()
  manager?: string;

  @IsOptional()
  @IsString()
  representative?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  serviceAgreementDate?: string;

  @IsOptional()
  @IsString()
  serviceDeclarationDate?: string;

  @IsOptional()
  @IsString()
  joinDate?: string;

  @IsOptional()
  @IsString()
  supportDeclaration?: string;

  @IsOptional()
  @IsString()
  budget2024?: string;

  @IsOptional()
  @IsString()
  budget2025?: string;

  @IsOptional()
  @IsString()
  israeliPlayerRequest?: string;

  @IsOptional()
  @IsString()
  supportRequest?: string;

  @IsOptional()
  @IsString()
  managementStatus?: string;

  @IsOptional()
  @IsString()
  digitalSupportCommitmentZ61?: string;

  @IsOptional()
  @IsString()
  digitalDeclarationZ60?: string;

  @IsOptional()
  @IsString()
  declarationK001?: string;

  @IsOptional()
  @IsString()
  advanceK002?: string;

  @IsOptional()
  @IsString()
  supportSummaryZ62?: string;

  @IsOptional()
  @IsString()
  management2025?: string;

  @IsOptional()
  @IsString()
  generalNotes?: string;

  @IsOptional()
  @IsString()
  activeStatus?: string;

  @IsOptional()
  @IsObject()
  serviceAgreementsFile?: Record<string, any>;

  @IsOptional()
  @IsObject()
  declarationFile?: Record<string, any>;

  
}

export class UpdateClubDto {

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Types.ObjectId)
  organizationId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

   @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  clubEstablished?: string;

  @IsOptional()
  @IsString()
  manager?: string;

  @IsOptional()
  @IsString()
  representative?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  serviceAgreementDate?: string;

  @IsOptional()
  @IsString()
  serviceDeclarationDate?: string;

  @IsOptional()
  @IsString()
  joinDate?: string;

  @IsOptional()
  @IsString()
  supportDeclaration?: string;

  @IsOptional()
  @IsString()
  budget2024?: string;

  @IsOptional()
  @IsString()
  budget2025?: string;

  @IsOptional()
  @IsString()
  israeliPlayerRequest?: string;

  @IsOptional()
  @IsString()
  supportRequest?: string;

  @IsOptional()
  @IsString()
  managementStatus?: string;

  @IsOptional()
  @IsString()
  digitalSupportCommitmentZ61?: string;

  @IsOptional()
  @IsString()
  digitalDeclarationZ60?: string;

  @IsOptional()
  @IsString()
  declarationK001?: string;

  @IsOptional()
  @IsString()
  advanceK002?: string;

  @IsOptional()
  @IsString()
  supportSummaryZ62?: string;

  @IsOptional()
  @IsString()
  management2025?: string;

  @IsOptional()
  @IsString()
  generalNotes?: string;

  @IsOptional()
  @IsString()
  activeStatus?: string;

  @IsOptional()
  @IsObject()
  serviceAgreementsFile?: Record<string, any>;

  @IsOptional()
  @IsObject()
  declarationFile?: Record<string, any>;
}
