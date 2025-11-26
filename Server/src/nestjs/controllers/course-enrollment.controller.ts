import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Put, Query } from '@nestjs/common';
import { CourseEnrollmentService } from '../services/course-enrollment.service';
import { CreateCourseEnrollmentDto } from '../dto/course-enrollment.dto';
import { UpdateCourseEnrollmentDto } from '../dto/course-enrollment.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('course-enrollments')
@UseGuards(JwtAuthGuard)
export class CourseEnrollmentController {
  constructor(private readonly courseEnrollmentService: CourseEnrollmentService) {}

  @Post()
  create(@Body() createCourseEnrollmentDto: CreateCourseEnrollmentDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (user && user.organizationId) {
      createCourseEnrollmentDto.organizationId = user.organizationId;
    } else {
      throw new Error('User organizationId not found');
    }
    return this.courseEnrollmentService.create(createCourseEnrollmentDto);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: any) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.courseEnrollmentService.findAll(user.organizationId, query.courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseEnrollmentService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCourseEnrollmentDto: UpdateCourseEnrollmentDto) {
    return this.courseEnrollmentService.update(id, updateCourseEnrollmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseEnrollmentService.remove(id);
  }
}


