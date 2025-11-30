import { IsMongoId, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateCourseEnrollmentDto {
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsMongoId()
  @IsNotEmpty()
  courseId!: string;

  @IsMongoId()
  @IsNotEmpty()
  kidId!: string;

  @IsDateString()
  @IsOptional()
  enrollmentDate?: string;
}

export class UpdateCourseEnrollmentDto {
  @IsDateString()
  @IsOptional()
  enrollmentDate?: string;
}






