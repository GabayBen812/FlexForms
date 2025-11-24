import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseAttendanceController } from '../controllers/course-attendance.controller';
import { CourseAttendanceService } from '../services/course-attendance.service';
import { CourseAttendance, CourseAttendanceSchema } from '../schemas/course-attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseAttendance.name, schema: CourseAttendanceSchema },
    ]),
  ],
  controllers: [CourseAttendanceController],
  providers: [CourseAttendanceService],
  exports: [CourseAttendanceService],
})
export class CourseAttendanceModule {}

