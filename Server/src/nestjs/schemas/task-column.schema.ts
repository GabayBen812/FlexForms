import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskColumnDocument = TaskColumn & Document;

@Schema({ timestamps: true })
export class TaskColumn {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  key!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  color!: string;

  @Prop({ type: Number, default: 0 })
  order!: number;
}

export const TaskColumnSchema = SchemaFactory.createForClass(TaskColumn);
TaskColumnSchema.index({ organizationId: 1, key: 1 }, { unique: true });
TaskColumnSchema.index({ organizationId: 1, order: 1 });

