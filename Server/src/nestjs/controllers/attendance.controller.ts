import { Controller, Post, Body, Get, Query, BadRequestException, Param, UseGuards } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CreateAttendanceDto } from '../dto/attendance.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';

@Controller('emp')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('attendance')
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Get('attendance')
  async findByUserAndDate(
    @Query('userId') userId: string,
    @Query('date') date: string,
  ) {
    if (!userId || !date) {
      throw new BadRequestException('userId and date query parameters are required');
    }
    
    return this.attendanceService.findByUserAndDate(userId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get('attendance/organization/:organizationId')
  async findByOrganization(@Param('organizationId') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId parameter is required');
    }
    
    return this.attendanceService.findByOrganization(organizationId);
  }
}

