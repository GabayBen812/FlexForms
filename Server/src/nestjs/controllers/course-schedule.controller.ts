import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CourseScheduleService } from '../services/course-schedule.service';
import { CreateCourseScheduleDto, UpdateCourseScheduleDto, UpsertCourseScheduleListDto } from '../dto/course-schedule.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { FeatureFlagGuard } from '../middlewares/feature-flag.guard';
import { FeatureFlag } from '../middlewares/feature-flag.decorator';
import { Request } from 'express';

@Controller('courses/:courseId/schedule')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('ff_is_show_courses')
export class CourseScheduleController {
  constructor(private readonly courseScheduleService: CourseScheduleService) {}

  @Get()
  async findAll(@Param('courseId') courseId: string, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.courseScheduleService.findAllByCourse(courseId, user.organizationId);
  }

  @Post()
  async create(@Param('courseId') courseId: string, @Body() createCourseScheduleDto: CreateCourseScheduleDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    createCourseScheduleDto.courseId = courseId;
    createCourseScheduleDto.organizationId = user.organizationId;
    return this.courseScheduleService.create(createCourseScheduleDto);
  }

  @Put()
  async upsertAll(@Param('courseId') courseId: string, @Body() upsertDto: UpsertCourseScheduleListDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    upsertDto.courseId = courseId;
    upsertDto.organizationId = user.organizationId;
    return this.courseScheduleService.upsertAll(upsertDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.courseScheduleService.remove(id, user.organizationId);
  }
}


