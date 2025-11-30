import { IsMongoId, IsNotEmpty, IsDateString, IsOptional, IsEnum, IsString } from 'class-validator';
import { CourseSessionStatus } from '../schemas/course-session.schema';

export class CreateCourseSessionDto {
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsMongoId()
  @IsNotEmpty()
  courseId!: string;

  @IsMongoId()
  @IsNotEmpty()
  scheduleId!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsDateString()
  @IsNotEmpty()
  startDateTime!: string;

  @IsDateString()
  @IsNotEmpty()
  endDateTime!: string;

  @IsEnum(CourseSessionStatus)
  @IsOptional()
  status?: CourseSessionStatus;
}

export class UpdateCourseSessionDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  startDateTime?: string;

  @IsDateString()
  @IsOptional()
  endDateTime?: string;

  @IsEnum(CourseSessionStatus)
  @IsOptional()
  status?: CourseSessionStatus;
}






