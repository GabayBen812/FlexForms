import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: false, versionKey: false })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: false },
    },
    required: true,
  })
  user!: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ required: true })
  action!: string;

  @Prop({ type: Date, required: true })
  timestamp!: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.set('collection', 'Attendance');

