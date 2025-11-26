import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseAttendance, CourseAttendanceDocument } from '../schemas/course-attendance.schema';
import { CreateCourseAttendanceDto, BulkUpsertCourseAttendanceDto } from '../dto/course-attendance.dto';

@Injectable()
export class CourseAttendanceService {
  constructor(
    @InjectModel(CourseAttendance.name) private courseAttendanceModel: Model<CourseAttendanceDocument>,
  ) {}

  async createOrUpdate(createCourseAttendanceDto: CreateCourseAttendanceDto): Promise<CourseAttendance> {
    const attendanceDate = new Date(createCourseAttendanceDto.date);
    // Set time to start of day for consistent date comparison
    attendanceDate.setHours(0, 0, 0, 0);

    const filter = {
      organizationId: new Types.ObjectId(createCourseAttendanceDto.organizationId),
      courseId: new Types.ObjectId(createCourseAttendanceDto.courseId),
      kidId: new Types.ObjectId(createCourseAttendanceDto.kidId),
      date: attendanceDate,
    };

    const updateData = {
      ...filter,
      attended: createCourseAttendanceDto.attended ?? false,
      notes: createCourseAttendanceDto.notes,
    };

    return this.courseAttendanceModel
      .findOneAndUpdate(filter, updateData, { new: true, upsert: true })
      .exec();
  }

  async findByCourseAndDate(organizationId: string, courseId: string, date: string): Promise<CourseAttendance[]> {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    return this.courseAttendanceModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        courseId: new Types.ObjectId(courseId),
        date: attendanceDate,
      })
      .populate('kidId', 'firstname lastname')
      .exec();
  }

  async bulkUpsert(bulkDto: BulkUpsertCourseAttendanceDto): Promise<CourseAttendance[]> {
    const attendanceDate = new Date(bulkDto.date);
    attendanceDate.setHours(0, 0, 0, 0);

    const operations = bulkDto.records.map((record) => {
      const filter = {
        organizationId: new Types.ObjectId(bulkDto.organizationId),
        courseId: new Types.ObjectId(bulkDto.courseId),
        kidId: new Types.ObjectId(record.kidId),
        date: attendanceDate,
      };

      const updateData = {
        ...filter,
        attended: record.attended ?? false,
        notes: record.notes,
      };

      return {
        updateOne: {
          filter,
          update: { $set: updateData },
          upsert: true,
        },
      };
    });

    await this.courseAttendanceModel.bulkWrite(operations);

    // Return all attendance records for the date
    return this.findByCourseAndDate(bulkDto.organizationId, bulkDto.courseId, bulkDto.date);
  }
}


