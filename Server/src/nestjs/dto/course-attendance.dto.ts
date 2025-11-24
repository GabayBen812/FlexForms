import { IsMongoId, IsNotEmpty, IsDateString, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCourseAttendanceDto {
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
  @IsNotEmpty()
  date!: string;

  @IsBoolean()
  @IsOptional()
  attended?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkUpsertCourseAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsMongoId()
  @IsNotEmpty()
  courseId!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsNotEmpty()
  records!: CreateCourseAttendanceDto[];
}

