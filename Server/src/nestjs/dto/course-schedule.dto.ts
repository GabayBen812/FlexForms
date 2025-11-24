import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  IsDateString,
  Matches,
  Min,
  Max,
  ValidateIf,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseScheduleDto {
  @IsMongoId()
  @IsNotEmpty()
  courseId!: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string; // HH:mm format

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime!: string; // HH:mm format

  @IsDateString()
  @IsNotEmpty()
  startDate!: string; // ISO date string

  @IsDateString()
  @IsNotEmpty()
  endDate!: string; // ISO date string
}

export class UpdateCourseScheduleDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  @ValidateIf((o) => o.dayOfWeek !== undefined)
  dayOfWeek?: number;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  @ValidateIf((o) => o.startTime !== undefined)
  startTime?: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  @ValidateIf((o) => o.endTime !== undefined)
  endTime?: string;

  @IsDateString()
  @ValidateIf((o) => o.startDate !== undefined)
  startDate?: string;

  @IsDateString()
  @ValidateIf((o) => o.endDate !== undefined)
  endDate?: string;
}

export class UpsertCourseScheduleListDto {
  @IsMongoId()
  @IsNotEmpty()
  courseId!: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCourseScheduleDto)
  schedules!: CreateCourseScheduleDto[];
}

