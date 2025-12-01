import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SeasonDocument = Season & Document;

@Schema({ timestamps: true })
export class Season {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Number, default: 0 })
  order!: number;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;
}

export const SeasonSchema = SchemaFactory.createForClass(Season);
SeasonSchema.set('collection', 'Seasons');
SeasonSchema.index({ organizationId: 1, order: 1 });

