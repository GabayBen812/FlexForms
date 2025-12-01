import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseAttendance, CourseAttendanceDocument } from '../schemas/course-attendance.schema';
import { CreateCourseAttendanceDto, BulkUpsertCourseAttendanceDto } from '../dto/course-attendance.dto';
import { CourseEnrollment, CourseEnrollmentDocument } from '../schemas/course-enrollment.schema';

@Injectable()
export class CourseAttendanceService {
  constructor(
    @InjectModel(CourseAttendance.name) private courseAttendanceModel: Model<CourseAttendanceDocument>,
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
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

  async aggregateAttendanceByDate(organizationId: string, date: string): Promise<{ arrived: number; notArrived: number }> {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Get all unique kids enrolled in courses for this organization
    const enrolledKidIds = await this.courseEnrollmentModel
      .distinct('kidId', {
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    // Convert ObjectIds to strings for comparison
    const enrolledKidIdsSet = new Set<string>(
      enrolledKidIds.map((kidId) => 
        kidId instanceof Types.ObjectId ? kidId.toString() : String(kidId)
      )
    );

    // Get all attendance records for the date where attended is true
    const attendanceRecords = await this.courseAttendanceModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        date: attendanceDate,
        attended: true,
      })
      .exec();

    // Get unique kids who attended (attended: true)
    const attendedKidIds = new Set<string>();
    attendanceRecords.forEach((record) => {
      let kidId: string;
      if (record.kidId instanceof Types.ObjectId) {
        kidId = record.kidId.toString();
      } else if (typeof record.kidId === 'object' && record.kidId !== null && '_id' in record.kidId) {
        kidId = String((record.kidId as any)._id);
      } else {
        kidId = String(record.kidId);
      }
      attendedKidIds.add(kidId);
    });

    // Calculate arrived (unique kids with attended: true)
    const arrived = attendedKidIds.size;

    // Calculate notArrived (enrolled kids who don't have attended: true)
    const notArrived = Array.from(enrolledKidIdsSet).filter((kidId) => !attendedKidIds.has(kidId)).length;

    return { arrived, notArrived };
  }
}






