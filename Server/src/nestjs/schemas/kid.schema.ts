import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KidDocument = Kid & Document;

@Schema({ timestamps: false, versionKey: false })
export class Kid {
  @Prop({ required: true })
  firstname!: string;

  @Prop({ required: true })
  lastname!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Parent' }], default: [] })
  linked_parents!: Types.ObjectId[];

  @Prop()
  address?: string;

  @Prop()
  idNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contact' })
  contactId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  dynamicFields!: Record<string, any>;
}

export const KidSchema = SchemaFactory.createForClass(Kid);
KidSchema.set('collection', 'Kids');

