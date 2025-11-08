import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '../dto/task.dto';
import { TaskColumnService } from './task-column.service';
import { TaskColumn } from '../schemas/task-column.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private readonly taskColumnService: TaskColumnService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const organizationId = this.asObjectId(createTaskDto.organizationId);
    const columns = await this.taskColumnService.findAllByOrganization(organizationId);

    if (!columns.length) {
      throw new BadRequestException('No task columns configured');
    }

    let column: TaskColumn | undefined;

    if (createTaskDto.status) {
      column = columns.find((c) => c.key === createTaskDto.status);
      if (!column) {
        throw new BadRequestException('Invalid task column');
      }
    } else {
      column = columns[0];
    }

    const status = column.key;

    const taskData: Partial<Task> & {
      createdBy: Types.ObjectId;
      organizationId: Types.ObjectId;
      order: number;
    } = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      status,
      createdBy: this.asObjectId(createTaskDto.createdBy),
      organizationId,
      order: await this.getNextOrder(organizationId, status),
      priority: createTaskDto.priority ?? 0,
    };

    if (createTaskDto.assignedTo) {
      taskData.assignedTo = this.asObjectId(createTaskDto.assignedTo);
    }

    if (createTaskDto.dueDate) {
      taskData.dueDate = new Date(createTaskDto.dueDate);
    }

    if (createTaskDto.tags) {
      taskData.tags = createTaskDto.tags;
    }

    const task = new this.taskModel(taskData);
    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);
    return task;
  }

  async findAll(organizationId: string): Promise<Task[]> {
    return this.taskModel
      .find({ organizationId: new Types.ObjectId(organizationId) })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ status: 1, order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Task | null> {
    return this.taskModel
      .findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();
  }

  async update(id: string, organizationId: string, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    const orgObjectId = this.asObjectId(organizationId);
    const task = await this.taskModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId: orgObjectId,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (updateTaskDto.status !== undefined && updateTaskDto.status !== task.status) {
      const column = await this.taskColumnService.findByKey(orgObjectId, updateTaskDto.status);
      if (!column) {
        throw new BadRequestException('Invalid task column');
      }

      const targetOrder =
        updateTaskDto.order !== undefined
          ? updateTaskDto.order
          : await this.getNextOrder(orgObjectId, updateTaskDto.status, task._id);
      await this.moveTaskInternal(task, orgObjectId, updateTaskDto.status, targetOrder);
    } else if (updateTaskDto.order !== undefined && updateTaskDto.order !== task.order) {
      await this.reorderWithinStatus(task, orgObjectId, updateTaskDto.order);
    }

    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) task.description = updateTaskDto.description;
    if (updateTaskDto.priority !== undefined) task.priority = updateTaskDto.priority;
    if (updateTaskDto.tags !== undefined) task.tags = updateTaskDto.tags;

    if (updateTaskDto.assignedTo !== undefined) {
      task.assignedTo = updateTaskDto.assignedTo ? this.asObjectId(updateTaskDto.assignedTo) : null;
    }

    if (updateTaskDto.dueDate !== undefined) {
      task.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    }

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    return task;
  }

  async moveTask(moveTaskDto: MoveTaskDto, organizationId: string): Promise<Task | null> {
    const { taskId, newStatus, newOrder } = moveTaskDto;
    const orgObjectId = this.asObjectId(organizationId);
    const column = await this.taskColumnService.findByKey(orgObjectId, newStatus);
    if (!column) {
      throw new BadRequestException('Invalid task column');
    }

    const task = await this.taskModel.findOne({
      _id: new Types.ObjectId(taskId),
      organizationId: orgObjectId,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.moveTaskInternal(task, orgObjectId, newStatus, newOrder);

    return this.taskModel
      .findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();
  }

  async remove(id: string, organizationId: string): Promise<Task | null> {
    const orgObjectId = this.asObjectId(organizationId);
    const task = await this.taskModel
      .findOne({
        _id: new Types.ObjectId(id),
        organizationId: orgObjectId,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskModel.deleteOne({
      _id: new Types.ObjectId(id),
      organizationId: orgObjectId,
    });

    await this.taskModel.updateMany(
      {
        organizationId: orgObjectId,
        status: task.status,
        order: { $gt: task.order },
      },
      { $inc: { order: -1 } },
    );

    return task;
  }

  private asObjectId(value: string | Types.ObjectId | undefined | null): Types.ObjectId {
    if (!value) {
      throw new BadRequestException('Missing identifier');
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    return new Types.ObjectId(value);
  }

  private async getNextOrder(
    organizationId: Types.ObjectId,
    status: string,
    excludeTaskId?: Types.ObjectId,
  ): Promise<number> {
    const query: Record<string, unknown> = {
      organizationId,
      status,
    };

    if (excludeTaskId) {
      query._id = { $ne: excludeTaskId };
    }

    const count = await this.taskModel.countDocuments(query);
    return count;
  }

  private async normalizeOrder(
    organizationId: Types.ObjectId,
    status: string,
    excludeTaskId: Types.ObjectId | null,
    desiredOrder: number,
  ): Promise<number> {
    const query: Record<string, unknown> = {
      organizationId,
      status,
    };

    if (excludeTaskId) {
      query._id = { $ne: excludeTaskId };
    }

    const count = await this.taskModel.countDocuments(query);
    if (desiredOrder < 0) return 0;
    if (desiredOrder > count) return count;
    return desiredOrder;
  }

  private async moveTaskInternal(
    task: TaskDocument,
    organizationId: Types.ObjectId,
    newStatus: string,
    requestedOrder: number,
  ): Promise<void> {
    const currentStatus = task.status;
    const normalizedOrder = await this.normalizeOrder(
      organizationId,
      newStatus,
      task._id,
      requestedOrder,
    );

    if (currentStatus === newStatus) {
      if (normalizedOrder === task.order) {
        return;
      }

      if (normalizedOrder > task.order) {
        await this.taskModel.updateMany(
          {
            organizationId,
            status: currentStatus,
            order: { $gt: task.order, $lte: normalizedOrder },
          },
          { $inc: { order: -1 } },
        );
      } else {
        await this.taskModel.updateMany(
          {
            organizationId,
            status: currentStatus,
            order: { $gte: normalizedOrder, $lt: task.order },
          },
          { $inc: { order: 1 } },
        );
      }

      task.order = normalizedOrder;
      await task.save();
      return;
    }

    await this.taskModel.updateMany(
      {
        organizationId,
        status: currentStatus,
        order: { $gt: task.order },
      },
      { $inc: { order: -1 } },
    );

    await this.taskModel.updateMany(
      {
        organizationId,
        status: newStatus,
        _id: { $ne: task._id },
        order: { $gte: normalizedOrder },
      },
      { $inc: { order: 1 } },
    );

    task.status = newStatus;
    task.order = normalizedOrder;
    await task.save();
  }

  private async reorderWithinStatus(
    task: TaskDocument,
    organizationId: Types.ObjectId,
    requestedOrder: number,
  ): Promise<void> {
    await this.moveTaskInternal(task, organizationId, task.status, requestedOrder);
  }
}





