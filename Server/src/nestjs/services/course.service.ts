import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../schemas/course.schema';
import { CreateCourseDto } from '../dto/course.dto';
import { UpdateCourseDto } from '../dto/course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const createdCourse = new this.courseModel(createCourseDto);
    return createdCourse.save();
  }

  async findAll(organizationId: string, seasonId?: string): Promise<Course[]> {
    const filter: any = { organizationId };
    
    // Season filtering: show courses matching seasonId OR courses with no season
    if (seasonId) {
      filter.$or = [
        { seasonId: seasonId },
        { seasonId: { $exists: false } },
        { seasonId: null }
      ];
    }
    
    return this.courseModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Course | null> {
    return this.courseModel.findById(id).exec();
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course | null> {
    return this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Course | null> {
    return this.courseModel.findByIdAndDelete(id).exec();
  }
}






