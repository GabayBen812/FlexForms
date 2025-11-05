import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ParentDocument = Parent & Document;

@Schema({ timestamps: false, versionKey: false })
export class Parent {
  @Prop({ required: true })
  firstname!: string;

  @Prop({ required: true })
  lastname!: string;

  @Prop({ required: true })
  birthdate!: Date;

  @Prop({ required: true })
  sex!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Kid' }], default: [] })
  linked_kids!: Types.ObjectId[];

  @Prop()
  address?: string;

  @Prop()
  idNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  dynamicFields!: Record<string, any>;
}

export const ParentSchema = SchemaFactory.createForClass(Parent);
ParentSchema.set('collection', 'Parents');

