import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { TaskColumnService } from '../services/task-column.service';
import { CreateTaskColumnDto, UpdateTaskColumnDto, ReorderTaskColumnsDto } from '../dto/task-column.dto';
import { Request } from 'express';
import { Types } from 'mongoose';

@Controller('task-columns')
@UseGuards(JwtAuthGuard)
export class TaskColumnController {
  constructor(private readonly taskColumnService: TaskColumnService) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }

    return this.taskColumnService.findAllByOrganization(new Types.ObjectId(user.organizationId));
  }

  @Post()
  async create(@Body() dto: CreateTaskColumnDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }

    return this.taskColumnService.createColumn(new Types.ObjectId(user.organizationId), dto);
  }

  @Patch('reorder')
  async reorder(@Body() dto: ReorderTaskColumnsDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }

    await this.taskColumnService.reorderColumns(
      new Types.ObjectId(user.organizationId),
      dto.columnIds,
    );
    return { success: true };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskColumnDto,
    @Req() req: Request,
  ) {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }

    return this.taskColumnService.updateColumn(
      new Types.ObjectId(user.organizationId),
      id,
      dto,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }

    await this.taskColumnService.deleteColumn(new Types.ObjectId(user.organizationId), id);
    return { success: true };
  }
}

