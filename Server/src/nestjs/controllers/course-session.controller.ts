import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { CourseSessionService } from '../services/course-session.service';
import { CreateCourseSessionDto } from '../dto/course-session.dto';
import { UpdateCourseSessionDto } from '../dto/course-session.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('course-sessions')
@UseGuards(JwtAuthGuard)
export class CourseSessionController {
  constructor(private readonly courseSessionService: CourseSessionService) {}

  @Post()
  create(@Body() createCourseSessionDto: CreateCourseSessionDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (user && user.organizationId) {
      createCourseSessionDto.organizationId = user.organizationId;
    } else {
      throw new Error('User organizationId not found');
    }
    return this.courseSessionService.create(createCourseSessionDto);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: any) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.courseSessionService.findAll(user.organizationId, query.courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseSessionService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCourseSessionDto: UpdateCourseSessionDto) {
    return this.courseSessionService.update(id, updateCourseSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseSessionService.remove(id);
  }
}

