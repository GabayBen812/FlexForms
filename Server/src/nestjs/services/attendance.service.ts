import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from '../schemas/attendance.schema';
import { CreateAttendanceDto } from '../dto/attendance.dto';
import { UserService } from './user.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    private readonly userService: UserService,
  ) {}

  async create(createAttendanceDto: CreateAttendanceDto, organizationId?: string): Promise<Attendance> {
    // If organizationId is not provided, look it up from the user
    let orgId = organizationId;
    if (!orgId) {
      const user = await this.userService.findById(createAttendanceDto.user.id);
      if (!user) {
        throw new NotFoundException(`User with id ${createAttendanceDto.user.id} not found`);
      }
      orgId = user.organizationId.toString();
    }

    const attendanceData: any = {
      userId: new Types.ObjectId(createAttendanceDto.user.id),
      user: {
        id: createAttendanceDto.user.id,
        email: createAttendanceDto.user.email,
        name: createAttendanceDto.user.name,
        role: createAttendanceDto.user.role,
      },
      organizationId: new Types.ObjectId(orgId),
      action: createAttendanceDto.action,
      timestamp: new Date(createAttendanceDto.timestamp),
    };

    const createdAttendance = new this.attendanceModel(attendanceData);
    return createdAttendance.save();
  }
}

