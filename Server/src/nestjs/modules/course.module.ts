import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { Course, CourseSchema } from '../schemas/course.schema';
import { CourseEnrollment, CourseEnrollmentSchema } from '../schemas/course-enrollment.schema';
import { CourseEnrollmentService } from '../services/course-enrollment.service';
import { CourseEnrollmentController } from '../controllers/course-enrollment.controller';
import { CourseSchedule, CourseScheduleSchema } from '../schemas/course-schedule.schema';
import { CourseScheduleService } from '../services/course-schedule.service';
import { CourseScheduleController } from '../controllers/course-schedule.controller';
import { CourseSession, CourseSessionSchema } from '../schemas/course-session.schema';
import { CourseSessionService } from '../services/course-session.service';
import { CourseSessionController } from '../controllers/course-session.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: CourseSchedule.name, schema: CourseScheduleSchema },
      { name: CourseSession.name, schema: CourseSessionSchema },
    ]),
  ],
  controllers: [CourseController, CourseEnrollmentController, CourseScheduleController, CourseSessionController],
  providers: [CourseService, CourseEnrollmentService, CourseScheduleService, CourseSessionService],
  exports: [CourseService, CourseEnrollmentService, CourseScheduleService, CourseSessionService],
})
export class CourseModule {}

