import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseAttendanceDocument = CourseAttendance & Document;

@Schema({ timestamps: true })
export class CourseAttendance {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true })
  kidId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ type: Boolean, default: false })
  attended!: boolean;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;
}

export const CourseAttendanceSchema = SchemaFactory.createForClass(CourseAttendance);
CourseAttendanceSchema.set('collection', 'CoursesAttendance');
CourseAttendanceSchema.index({ courseId: 1, date: 1, kidId: 1 });
CourseAttendanceSchema.index({ organizationId: 1, courseId: 1, date: 1 });






