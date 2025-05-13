import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClubDocument = Club & Document;

@Schema({ timestamps: true })
export class Club {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;
}

export const ClubSchema = SchemaFactory.createForClass(Club);
ClubSchema.set('collection', 'Clubs');
