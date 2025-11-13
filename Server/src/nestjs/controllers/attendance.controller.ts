import { Controller, Post, Body } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CreateAttendanceDto } from '../dto/attendance.dto';

@Controller('emp')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('attendance')
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }
}

