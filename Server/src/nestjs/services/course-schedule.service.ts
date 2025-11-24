import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseSchedule, CourseScheduleDocument } from '../schemas/course-schedule.schema';
import { CreateCourseScheduleDto, UpdateCourseScheduleDto, UpsertCourseScheduleListDto } from '../dto/course-schedule.dto';
import { CourseService } from './course.service';
import { CourseSessionService } from './course-session.service';

@Injectable()
export class CourseScheduleService {
  constructor(
    @InjectModel(CourseSchedule.name) private courseScheduleModel: Model<CourseScheduleDocument>,
    private courseService: CourseService,
    private courseSessionService: CourseSessionService,
  ) {}

  async validateCourseAccess(courseId: string, organizationId: string): Promise<void> {
    const course = await this.courseService.findOne(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.organizationId.toString() !== organizationId) {
      throw new BadRequestException('Course does not belong to your organization');
    }
  }

  async validateTimeRange(startTime: string, endTime: string): Promise<void> {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (endTotal <= startTotal) {
      throw new BadRequestException('endTime must be after startTime');
    }
  }

  async validateDateRange(startDate: Date, endDate: Date): Promise<void> {
    if (endDate < startDate) {
      throw new BadRequestException('endDate must be after or equal to startDate');
    }
  }

  async create(createCourseScheduleDto: CreateCourseScheduleDto): Promise<CourseSchedule> {
    await this.validateCourseAccess(createCourseScheduleDto.courseId, createCourseScheduleDto.organizationId);
    await this.validateTimeRange(createCourseScheduleDto.startTime, createCourseScheduleDto.endTime);
    
    const startDate = new Date(createCourseScheduleDto.startDate);
    const endDate = new Date(createCourseScheduleDto.endDate);
    await this.validateDateRange(startDate, endDate);

    const scheduleData = {
      courseId: new Types.ObjectId(createCourseScheduleDto.courseId),
      organizationId: new Types.ObjectId(createCourseScheduleDto.organizationId),
      dayOfWeek: createCourseScheduleDto.dayOfWeek,
      startTime: createCourseScheduleDto.startTime,
      endTime: createCourseScheduleDto.endTime,
      startDate,
      endDate,
    };

    const createdSchedule = new this.courseScheduleModel(scheduleData);
    return createdSchedule.save();
  }

  async findAllByCourse(courseId: string, organizationId: string): Promise<CourseSchedule[]> {
    await this.validateCourseAccess(courseId, organizationId);
    
    return this.courseScheduleModel
      .find({
        courseId: new Types.ObjectId(courseId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .exec();
  }

  async upsertAll(upsertDto: UpsertCourseScheduleListDto): Promise<CourseSchedule[]> {
    await this.validateCourseAccess(upsertDto.courseId, upsertDto.organizationId);

    // Validate all schedules before processing
    for (const schedule of upsertDto.schedules) {
      await this.validateTimeRange(schedule.startTime, schedule.endTime);
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      await this.validateDateRange(startDate, endDate);
    }

    const courseId = new Types.ObjectId(upsertDto.courseId);
    const organizationId = new Types.ObjectId(upsertDto.organizationId);

    // Find the earliest startDate from all schedules for session deletion
    const earliestStartDate = upsertDto.schedules.reduce((earliest, schedule) => {
      const scheduleStartDate = new Date(schedule.startDate);
      return scheduleStartDate < earliest ? scheduleStartDate : earliest;
    }, new Date(upsertDto.schedules[0].startDate));

    // Delete all existing schedules for this course
    await this.courseScheduleModel
      .deleteMany({
        courseId,
        organizationId,
      })
      .exec();

    // Create new schedules
    const schedulesToCreate = upsertDto.schedules.map((schedule) => ({
      courseId,
      organizationId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      startDate: new Date(schedule.startDate),
      endDate: new Date(schedule.endDate),
    }));

    if (schedulesToCreate.length > 0) {
      await this.courseScheduleModel.insertMany(schedulesToCreate);
    }

    // Get saved schedules with _id for session generation
    const savedSchedules = await this.findAllByCourse(upsertDto.courseId, upsertDto.organizationId);

    // Delete future sessions and generate new ones
    if (savedSchedules.length > 0) {
      await this.courseSessionService.deleteFutureSessions(
        upsertDto.courseId,
        upsertDto.organizationId,
        earliestStartDate,
      );
      await this.courseSessionService.generateSessionsFromSchedules(savedSchedules);
    }

    // Return all schedules for the course
    return savedSchedules;
  }

  async findOne(id: string): Promise<CourseSchedule | null> {
    return this.courseScheduleModel.findById(id).exec();
  }

  async update(id: string, updateCourseScheduleDto: UpdateCourseScheduleDto, organizationId: string): Promise<CourseSchedule | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Course schedule not found');
    }

    if (existing.organizationId.toString() !== organizationId) {
      throw new BadRequestException('Course schedule does not belong to your organization');
    }

    const updateData: Record<string, unknown> = {};

    if (updateCourseScheduleDto.dayOfWeek !== undefined) {
      updateData.dayOfWeek = updateCourseScheduleDto.dayOfWeek;
    }
    if (updateCourseScheduleDto.startTime !== undefined) {
      updateData.startTime = updateCourseScheduleDto.startTime;
    }
    if (updateCourseScheduleDto.endTime !== undefined) {
      updateData.endTime = updateCourseScheduleDto.endTime;
    }
    if (updateCourseScheduleDto.startDate !== undefined) {
      updateData.startDate = new Date(updateCourseScheduleDto.startDate);
    }
    if (updateCourseScheduleDto.endDate !== undefined) {
      updateData.endDate = new Date(updateCourseScheduleDto.endDate);
    }

    // Validate time range if both times are being updated
    if (updateData.startTime && updateData.endTime) {
      await this.validateTimeRange(updateData.startTime as string, updateData.endTime as string);
    } else if (updateData.startTime && existing.endTime) {
      await this.validateTimeRange(updateData.startTime as string, existing.endTime);
    } else if (updateData.endTime && existing.startTime) {
      await this.validateTimeRange(existing.startTime, updateData.endTime as string);
    }

    // Validate date range if both dates are being updated
    const finalStartDate = updateData.startDate ? (updateData.startDate as Date) : existing.startDate;
    const finalEndDate = updateData.endDate ? (updateData.endDate as Date) : existing.endDate;
    await this.validateDateRange(finalStartDate, finalEndDate);

    return this.courseScheduleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string, organizationId: string): Promise<CourseSchedule | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Course schedule not found');
    }

    if (existing.organizationId.toString() !== organizationId) {
      throw new BadRequestException('Course schedule does not belong to your organization');
    }

    return this.courseScheduleModel.findByIdAndDelete(id).exec();
  }
}

