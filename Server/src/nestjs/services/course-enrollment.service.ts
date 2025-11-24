import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseEnrollment, CourseEnrollmentDocument } from '../schemas/course-enrollment.schema';
import { CreateCourseEnrollmentDto, UpdateCourseEnrollmentDto } from '../dto/course-enrollment.dto';

@Injectable()
export class CourseEnrollmentService {
  constructor(
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
  ) {}

  async create(createCourseEnrollmentDto: CreateCourseEnrollmentDto): Promise<CourseEnrollment> {
    // Check if enrollment already exists
    const existing = await this.courseEnrollmentModel.findOne({
      organizationId: new Types.ObjectId(createCourseEnrollmentDto.organizationId),
      courseId: new Types.ObjectId(createCourseEnrollmentDto.courseId),
      kidId: new Types.ObjectId(createCourseEnrollmentDto.kidId),
    }).exec();

    if (existing) {
      throw new Error('Kid is already enrolled in this course');
    }

    const enrollmentData = {
      organizationId: new Types.ObjectId(createCourseEnrollmentDto.organizationId),
      courseId: new Types.ObjectId(createCourseEnrollmentDto.courseId),
      kidId: new Types.ObjectId(createCourseEnrollmentDto.kidId),
      enrollmentDate: createCourseEnrollmentDto.enrollmentDate 
        ? new Date(createCourseEnrollmentDto.enrollmentDate)
        : new Date(),
    };

    const createdEnrollment = new this.courseEnrollmentModel(enrollmentData);
    return createdEnrollment.save();
  }

  async findAll(organizationId: string, courseId?: string): Promise<CourseEnrollment[]> {
    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (courseId) {
      filter.courseId = new Types.ObjectId(courseId);
    }

    return this.courseEnrollmentModel
      .find(filter)
      .populate('kidId', 'firstname lastname')
      .populate('courseId', 'name')
      .exec();
  }

  async findOne(id: string): Promise<CourseEnrollment | null> {
    return this.courseEnrollmentModel
      .findById(id)
      .populate('kidId', 'firstname lastname')
      .populate('courseId', 'name')
      .exec();
  }

  async update(id: string, updateCourseEnrollmentDto: UpdateCourseEnrollmentDto): Promise<CourseEnrollment | null> {
    const updateData: Record<string, unknown> = {};
    
    if (updateCourseEnrollmentDto.enrollmentDate) {
      updateData.enrollmentDate = new Date(updateCourseEnrollmentDto.enrollmentDate);
    }

    return this.courseEnrollmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<CourseEnrollment | null> {
    return this.courseEnrollmentModel.findByIdAndDelete(id).exec();
  }

  async removeByKidAndCourse(courseId: string, kidId: string): Promise<CourseEnrollment | null> {
    const enrollment = await this.courseEnrollmentModel
      .findOne({
        courseId: new Types.ObjectId(courseId),
        kidId: new Types.ObjectId(kidId),
      })
      .exec();

    if (!enrollment) {
      return null;
    }

    await this.courseEnrollmentModel.deleteOne({ _id: enrollment._id }).exec();
    return enrollment;
  }
}

