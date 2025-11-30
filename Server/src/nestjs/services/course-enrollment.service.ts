import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseEnrollment } from '../schemas/course-enrollment.schema';
import { CreateCourseEnrollmentDto, UpdateCourseEnrollmentDto } from '../dto/course-enrollment.dto';

@Injectable()
export class CourseEnrollmentService {
  constructor(
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollment>,
  ) {}

  async create(createCourseEnrollmentDto: CreateCourseEnrollmentDto): Promise<CourseEnrollment> {
    const createdEnrollment = new this.courseEnrollmentModel(createCourseEnrollmentDto);
    return createdEnrollment.save();
  }

  async findAll(organizationId: string, courseId?: string): Promise<CourseEnrollment[]> {
    const filter: any = { organizationId };
    if (courseId) {
      filter.courseId = courseId;
    }
    return this.courseEnrollmentModel
      .find(filter)
      .populate('kidId', 'firstname lastname profileImageUrl')
      .exec();
  }

  async findOne(id: string): Promise<CourseEnrollment | null> {
    return this.courseEnrollmentModel.findById(id).exec();
  }

  async update(id: string, updateCourseEnrollmentDto: UpdateCourseEnrollmentDto): Promise<CourseEnrollment | null> {
    return this.courseEnrollmentModel
      .findByIdAndUpdate(id, updateCourseEnrollmentDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<CourseEnrollment | null> {
    return this.courseEnrollmentModel.findByIdAndDelete(id).exec();
  }
}
