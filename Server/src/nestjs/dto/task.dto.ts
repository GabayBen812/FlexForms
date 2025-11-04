import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsEnum, IsNumber, IsArray, IsDateString } from 'class-validator';
import { TaskStatus } from '../schemas/task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @IsMongoId()
  @IsNotEmpty()
  createdBy!: string;

  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class MoveTaskDto {
  @IsMongoId()
  @IsNotEmpty()
  taskId!: string;

  @IsEnum(TaskStatus)
  @IsNotEmpty()
  newStatus!: TaskStatus;

  @IsNumber()
  @IsNotEmpty()
  newOrder!: number;
}

