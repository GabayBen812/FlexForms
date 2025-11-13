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

  async findByUserAndDate(userId: string, date: string): Promise<Attendance[]> {
    // Parse the ISO date string
    const dateObj = new Date(date);
    
    // Calculate start of day (00:00:00.000)
    const startOfDay = new Date(dateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    // Calculate end of day (23:59:59.999)
    const endOfDay = new Date(dateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    // Query attendance records for the user within the day range
    const records = await this.attendanceModel
      .find({
        userId: new Types.ObjectId(userId),
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .sort({ timestamp: -1 }) // Descending order (newest first)
      .exec();
    
    return records;
  }

  async findByOrganization(organizationId: string): Promise<any[]> {
    // Fetch all attendance records for the organization
    const records = await this.attendanceModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
      })
      .sort({ timestamp: 1 }) // Ascending order (oldest first) for processing
      .lean()
      .exec();

    // Group records by userId and date
    const groupedByUserAndDate: Record<string, any[]> = {};
    
    records.forEach((record) => {
      const date = new Date(record.timestamp);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const key = `${record.userId}_${dateKey}`;
      
      if (!groupedByUserAndDate[key]) {
        groupedByUserAndDate[key] = [];
      }
      groupedByUserAndDate[key].push(record);
    });

    // Process each group into time shift cycles
    const shifts: any[] = [];

    Object.values(groupedByUserAndDate).forEach((userRecords) => {
      // Sort by timestamp ascending for this user/date
      userRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const employeeName = userRecords[0]?.user?.name || 'Unknown';

      // Process cycles: each start->stop sequence is a separate cycle
      let cycleStart: Date | null = null;
      let firstPause: Date | null = null;
      let lastResume: Date | null = null;
      const pauseResumePairs: Array<{ pause: Date; resume: Date | null }> = [];

      userRecords.forEach((record) => {
        const timestamp = new Date(record.timestamp);
        const action = record.action;

        if (action === 'start') {
          // If there's a previous cycle without stop, save it as incomplete
          if (cycleStart) {
            const reportedDate = this.formatDateOnly(cycleStart);
            const shift = this.createShift(
              employeeName,
              reportedDate,
              cycleStart,
              firstPause,
              lastResume,
              null,
              pauseResumePairs
            );
            shifts.push(shift);
          }

          // Start a new cycle
          cycleStart = timestamp;
          firstPause = null;
          lastResume = null;
          pauseResumePairs.length = 0;
        } else if (action === 'pause' && cycleStart) {
          if (!firstPause) {
            firstPause = timestamp;
          }
          pauseResumePairs.push({ pause: timestamp, resume: null });
        } else if (action === 'resume' && cycleStart) {
          lastResume = timestamp;
          // Update the last pause pair with resume time
          if (pauseResumePairs.length > 0) {
            const lastPair = pauseResumePairs[pauseResumePairs.length - 1];
            if (!lastPair.resume) {
              lastPair.resume = timestamp;
            }
          }
        } else if (action === 'stop' && cycleStart) {
          // Complete the cycle - use the startTime date for reportedDate
          const reportedDate = this.formatDateOnly(cycleStart);
          const shift = this.createShift(
            employeeName,
            reportedDate,
            cycleStart,
            firstPause,
            lastResume,
            timestamp,
            pauseResumePairs
          );
          shifts.push(shift);

          // Reset for next cycle
          cycleStart = null;
          firstPause = null;
          lastResume = null;
          pauseResumePairs.length = 0;
        }
      });

      // Handle incomplete cycle (started but not stopped)
      if (cycleStart) {
        const reportedDate = this.formatDateOnly(cycleStart);
        const shift = this.createShift(
          employeeName,
          reportedDate,
          cycleStart,
          firstPause,
          lastResume,
          null,
          pauseResumePairs
        );
        shifts.push(shift);
      }
    });

    return shifts;
  }

  private createShift(
    employeeName: string,
    reportedDate: string,
    startTime: Date,
    firstPause: Date | null,
    lastResume: Date | null,
    stopTime: Date | null,
    pauseResumePairs: Array<{ pause: Date; resume: Date | null }>
  ): any {
    // Generate a unique ID for this shift based on timestamp and employee name
    const uniqueId = `${employeeName}_${startTime.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const shift: any = {
      _id: uniqueId,
      employeeName,
      reportedDate,
      startTime: this.formatTime(startTime),
      pauseTime: firstPause ? this.formatTime(firstPause) : null,
      resumeTime: lastResume ? this.formatTime(lastResume) : null,
      stopTime: stopTime ? this.formatTime(stopTime) : null,
      totalTime: null,
    };

    // Calculate total time
    const endTime = stopTime || new Date();
    let totalPauseTime = 0;

    // Calculate pause time from all pause/resume pairs
    pauseResumePairs.forEach((pair) => {
      if (pair.pause && pair.resume) {
        totalPauseTime += pair.resume.getTime() - pair.pause.getTime();
      } else if (pair.pause && !pair.resume) {
        // If paused but not resumed, subtract time from pause to end
        totalPauseTime += endTime.getTime() - pair.pause.getTime();
      }
    });

    const totalTimeMs = endTime.getTime() - startTime.getTime() - totalPauseTime;
    shift.totalTime = this.formatTimeFromMs(Math.max(0, totalTimeMs));

    return shift;
  }

  private formatDateOnly(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private formatTimeFromMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

