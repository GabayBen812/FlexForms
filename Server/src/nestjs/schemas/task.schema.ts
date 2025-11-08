import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ type: String, required: true })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  order!: number; // For sorting within the same status

  @Prop()
  dueDate?: Date;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Number, default: 0 })
  priority!: number; // 0 = low, 1 = medium, 2 = high
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.set('collection', 'Tasks');
TaskSchema.index({ organizationId: 1, status: 1, order: 1 });








