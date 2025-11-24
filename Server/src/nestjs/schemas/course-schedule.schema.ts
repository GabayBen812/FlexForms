import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class CourseSchedule extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  courseId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0, max: 6 })
  dayOfWeek!: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Prop({ type: String, required: true })
  startTime!: string; // HH:mm format

  @Prop({ type: String, required: true })
  endTime!: string; // HH:mm format

  @Prop({ type: Date, required: true })
  startDate!: Date; // Course schedule validity start date

  @Prop({ type: Date, required: true })
  endDate!: Date; // Course schedule validity end date
}

export type CourseScheduleDocument = CourseSchedule & Document;

export const CourseScheduleSchema = SchemaFactory.createForClass(CourseSchedule);
CourseScheduleSchema.set('collection', 'CoursesSchedules');
CourseScheduleSchema.index({ courseId: 1, organizationId: 1 });
CourseScheduleSchema.index({ courseId: 1, dayOfWeek: 1 });

