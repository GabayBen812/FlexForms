import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseSession, CourseSessionDocument, CourseSessionStatus } from '../schemas/course-session.schema';
import { CourseSchedule, CourseScheduleDocument } from '../schemas/course-schedule.schema';
import { CreateCourseSessionDto, UpdateCourseSessionDto } from '../dto/course-session.dto';

@Injectable()
export class CourseSessionService {
  constructor(
    @InjectModel(CourseSession.name) private courseSessionModel: Model<CourseSessionDocument>,
  ) {}

  async create(createCourseSessionDto: CreateCourseSessionDto): Promise<CourseSession> {
    const sessionData = {
      organizationId: new Types.ObjectId(createCourseSessionDto.organizationId),
      courseId: new Types.ObjectId(createCourseSessionDto.courseId),
      scheduleId: new Types.ObjectId(createCourseSessionDto.scheduleId),
      date: new Date(createCourseSessionDto.date),
      startDateTime: new Date(createCourseSessionDto.startDateTime),
      endDateTime: new Date(createCourseSessionDto.endDateTime),
      status: createCourseSessionDto.status || CourseSessionStatus.NORMAL,
    };

    const createdSession = new this.courseSessionModel(sessionData);
    return createdSession.save();
  }

  async findAll(organizationId: string, courseId?: string): Promise<CourseSession[]> {
    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (courseId) {
      filter.courseId = new Types.ObjectId(courseId);
    }

    return this.courseSessionModel
      .find(filter)
      .populate('courseId', 'name')
      .populate('scheduleId')
      .sort({ date: 1, startDateTime: 1 })
      .exec();
  }

  async findOne(id: string): Promise<CourseSession | null> {
    return this.courseSessionModel
      .findById(id)
      .populate('courseId', 'name')
      .populate('scheduleId')
      .exec();
  }

  async update(id: string, updateCourseSessionDto: UpdateCourseSessionDto): Promise<CourseSession | null> {
    const updateData: Record<string, unknown> = {};
    
    if (updateCourseSessionDto.date) {
      updateData.date = new Date(updateCourseSessionDto.date);
    }
    if (updateCourseSessionDto.startDateTime) {
      updateData.startDateTime = new Date(updateCourseSessionDto.startDateTime);
    }
    if (updateCourseSessionDto.endDateTime) {
      updateData.endDateTime = new Date(updateCourseSessionDto.endDateTime);
    }
    if (updateCourseSessionDto.status !== undefined) {
      updateData.status = updateCourseSessionDto.status;
    }

    return this.courseSessionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<CourseSession | null> {
    return this.courseSessionModel.findByIdAndDelete(id).exec();
  }

  /**
   * Delete all future sessions for a course (date >= startDate)
   */
  async deleteFutureSessions(
    courseId: string,
    organizationId: string,
    startDate: Date,
  ): Promise<void> {
    const courseIdObj = new Types.ObjectId(courseId);
    const organizationIdObj = new Types.ObjectId(organizationId);

    // Normalize startDate to start of day for comparison
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    await this.courseSessionModel
      .deleteMany({
        courseId: courseIdObj,
        organizationId: organizationIdObj,
        date: { $gte: startOfDay },
      })
      .exec();
  }

  /**
   * Generate recurring sessions from schedule items
   * For each schedule, creates sessions for each week occurrence between startDate and endDate
   */
  async generateSessionsFromSchedules(
    schedules: CourseScheduleDocument[],
  ): Promise<CourseSessionDocument[]> {
    const sessionsToCreate: Array<{
      organizationId: any;
      courseId: any;
      scheduleId: any;
      date: Date;
      startDateTime: Date;
      endDateTime: Date;
      status: CourseSessionStatus;
    }> = [];

    for (const schedule of schedules) {
      const occurrences = this.findDateOccurrences(
        schedule.startDate,
        schedule.endDate,
        schedule.dayOfWeek,
      );

      for (const date of occurrences) {
        const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
        const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);

        const startDateTime = new Date(date);
        startDateTime.setHours(startHours, startMinutes, 0, 0);

        const endDateTime = new Date(date);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        // Normalize date to start of day (without hours)
        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);

        sessionsToCreate.push({
          organizationId: schedule.organizationId,
          courseId: schedule.courseId,
          scheduleId: schedule._id,
          date: sessionDate,
          startDateTime,
          endDateTime,
          status: CourseSessionStatus.NORMAL,
        });
      }
    }

    if (sessionsToCreate.length > 0) {
      const createdSessions = await this.courseSessionModel.insertMany(sessionsToCreate);
      return createdSessions;
    }

    return [];
  }

  /**
   * Find all dates matching dayOfWeek between startDate and endDate
   * dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  private findDateOccurrences(startDate: Date, endDate: Date, dayOfWeek: number): Date[] {
    const occurrences: Date[] = [];
    
    // Normalize dates to start of day for comparison
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Find first occurrence of dayOfWeek >= startDate
    const startDayOfWeek = start.getDay();
    let daysToAdd = dayOfWeek - startDayOfWeek;
    
    // If the target day is earlier in the week, move to next week
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    const firstOccurrence = new Date(start);
    firstOccurrence.setDate(start.getDate() + daysToAdd);

    // Generate all occurrences
    const occurrence = new Date(firstOccurrence);
    while (occurrence <= end) {
      occurrences.push(new Date(occurrence));
      occurrence.setDate(occurrence.getDate() + 7); // Move to next week
    }

    return occurrences;
  }
}

