import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class CourseEnrollment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  courseId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Kid', required: true })
  kidId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  enrollmentDate!: Date;
}

export const CourseEnrollmentSchema = SchemaFactory.createForClass(CourseEnrollment);
CourseEnrollmentSchema.set('collection', 'CoursesEnrollments');

export type CourseEnrollmentDocument = HydratedDocument<CourseEnrollment>;

