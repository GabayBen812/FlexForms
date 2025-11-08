import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsNumber, IsArray, IsDateString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status?: string;

  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @IsMongoId()
  @IsOptional()
  createdBy!: string;

  @IsMongoId()
  @IsOptional()
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

  @IsString()
  @IsOptional()
  status?: string;

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

  @IsString()
  @IsNotEmpty()
  newStatus!: string;

  @IsNumber()
  @IsNotEmpty()
  newOrder!: number;
}








