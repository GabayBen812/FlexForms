import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { CourseAttendanceService } from '../services/course-attendance.service';
import { CreateCourseAttendanceDto, BulkUpsertCourseAttendanceDto } from '../dto/course-attendance.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('course-attendance')
@UseGuards(JwtAuthGuard)
export class CourseAttendanceController {
  constructor(private readonly courseAttendanceService: CourseAttendanceService) {}

  @Post()
  createOrUpdate(@Body() createCourseAttendanceDto: CreateCourseAttendanceDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (user && user.organizationId) {
      createCourseAttendanceDto.organizationId = user.organizationId;
    } else {
      throw new Error('User organizationId not found');
    }
    return this.courseAttendanceService.createOrUpdate(createCourseAttendanceDto);
  }

  @Post('bulk')
  bulkUpsert(@Body() bulkDto: BulkUpsertCourseAttendanceDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (user && user.organizationId) {
      bulkDto.organizationId = user.organizationId;
      bulkDto.records.forEach((record) => {
        record.organizationId = user.organizationId;
      });
    } else {
      throw new Error('User organizationId not found');
    }
    return this.courseAttendanceService.bulkUpsert(bulkDto);
  }

  @Get('course/:courseId/date/:date')
  findByCourseAndDate(@Param('courseId') courseId: string, @Param('date') date: string, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.courseAttendanceService.findByCourseAndDate(user.organizationId, courseId, date);
  }

  @Get('aggregate/:date')
  async aggregateAttendance(@Param('date') date: string, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.courseAttendanceService.aggregateAttendanceByDate(user.organizationId, date);
  }
}






