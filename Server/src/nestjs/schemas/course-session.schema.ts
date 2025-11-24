import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum CourseSessionStatus {
  NORMAL = 'NORMAL',
  CANCELLED = 'CANCELLED',
  MOVED = 'MOVED',
  TIME_CHANGED = 'TIME_CHANGED',
}

@Schema({ timestamps: true })
export class CourseSession extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  courseId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CourseSchedule', required: true })
  scheduleId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  date!: Date; // The original date of the session (without hours)

  @Prop({ type: Date, required: true })
  startDateTime!: Date; // Scheduled start time

  @Prop({ type: Date, required: true })
  endDateTime!: Date;

  @Prop({ 
    type: String, 
    required: true, 
    enum: ['NORMAL', 'CANCELLED', 'MOVED', 'TIME_CHANGED'],
    default: 'NORMAL'
  })
  status!: CourseSessionStatus;
}

export type CourseSessionDocument = CourseSession & Document;

export const CourseSessionSchema = SchemaFactory.createForClass(CourseSession);
CourseSessionSchema.set('collection', 'CoursesSessions');
CourseSessionSchema.index({ courseId: 1, organizationId: 1, date: 1 });
CourseSessionSchema.index({ scheduleId: 1 });
CourseSessionSchema.index({ date: 1 });

