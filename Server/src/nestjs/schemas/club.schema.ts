import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MSchema } from 'mongoose';

export type ClubDocument = Club & Document;

@Schema({ timestamps: true })
export class Club {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ required: true })
  email?: string;

  @Prop({ required: true })
  phone?: string;

  @Prop()
  number?: string;

  @Prop()
  clubEstablished?: string;

  @Prop()
  manager?: string;

  @Prop()
  representative?: string;

  @Prop()
  supplier?: string;

  @Prop({ type: String })
  serviceAgreementDate?: String;

  @Prop({ type: String })
  serviceDeclarationDate?: String;

  @Prop({ type: String })
  joinDate?: String;

  @Prop()
  supportDeclaration?: string;

  @Prop()
  budget2024?: string;

  @Prop()
  budget2025?: string;

  @Prop()
  israeliPlayerRequest?: string;

  @Prop()
  supportRequest?: string;

  @Prop()
  managementStatus?: string;

  @Prop()
  digitalSupportCommitmentZ61?: string;

  @Prop()
  digitalDeclarationZ60?: string;

  @Prop()
  declarationK001?: string;

  @Prop()
  advanceK002?: string;

  @Prop()
  supportSummaryZ62?: string;

  @Prop()
  management2025?: string;

  @Prop()
  generalNotes?: string;

  @Prop()
  activeStatus?: string;

  @Prop({ type: MSchema.Types.Mixed })
  serviceAgreementsFile?: Record<string, any>;

  @Prop({ type: MSchema.Types.Mixed })
  declarationFile?: Record<string, any>;
}

export const ClubSchema = SchemaFactory.createForClass(Club);
ClubSchema.set('collection', 'Clubs');
