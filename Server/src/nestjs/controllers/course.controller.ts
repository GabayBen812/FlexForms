import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/course.dto';
import { UpdateCourseDto } from '../dto/course.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { FeatureFlagGuard } from '../middlewares/feature-flag.guard';
import { FeatureFlag } from '../middlewares/feature-flag.decorator';
import { Request } from 'express';

@Controller('courses')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('ff_is_show_courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (user && user.organizationId) {
      createCourseDto.organizationId = user.organizationId;
    } else {
      throw new Error('User organizationId not found');
    }
    return this.courseService.create(createCourseDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.courseService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}

