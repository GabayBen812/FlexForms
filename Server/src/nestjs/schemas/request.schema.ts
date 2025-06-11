import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RequestDocument = Request & Document;

@Schema({ timestamps: true })
export class Request {
  @Prop({ required: true })
  name!: string;

  @Prop()
  submittedBy?: string;

  @Prop()
  type?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop()
  status?: string;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
RequestSchema.set('collection', 'Requests');