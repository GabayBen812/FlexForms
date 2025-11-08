import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '../dto/task.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: Request) {
    const user = req.user as { id: string; organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    if (!user.id) {
      throw new BadRequestException('User id not found');
    }
    createTaskDto.organizationId = user.organizationId;
    createTaskDto.createdBy = user.id;
    return this.taskService.create(createTaskDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.taskService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.taskService.update(id, user.organizationId, updateTaskDto);
  }

  @Post('move')
  moveTask(@Body() moveTaskDto: MoveTaskDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.taskService.moveTask(moveTaskDto, user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.taskService.remove(id, user.organizationId);
  }
}

