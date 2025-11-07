import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskStatus } from '../schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '../dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const taskData: any = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status || TaskStatus.TODO,
      createdBy: new Types.ObjectId(createTaskDto.createdBy),
      organizationId: new Types.ObjectId(createTaskDto.organizationId),
      order: createTaskDto.order || 0,
      priority: createTaskDto.priority || 0,
    };

    if (createTaskDto.assignedTo) {
      taskData.assignedTo = new Types.ObjectId(createTaskDto.assignedTo);
    }

    if (createTaskDto.dueDate) {
      taskData.dueDate = new Date(createTaskDto.dueDate);
    }

    if (createTaskDto.tags) {
      taskData.tags = createTaskDto.tags;
    }

    const task = new this.taskModel(taskData);
    return task.save();
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

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    const updateData: any = {};

    if (updateTaskDto.title !== undefined) updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) updateData.status = updateTaskDto.status;
    if (updateTaskDto.order !== undefined) updateData.order = updateTaskDto.order;
    if (updateTaskDto.priority !== undefined) updateData.priority = updateTaskDto.priority;
    if (updateTaskDto.tags !== undefined) updateData.tags = updateTaskDto.tags;

    if (updateTaskDto.assignedTo !== undefined) {
      updateData.assignedTo = updateTaskDto.assignedTo 
        ? new Types.ObjectId(updateTaskDto.assignedTo) 
        : null;
    }

    if (updateTaskDto.dueDate !== undefined) {
      updateData.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    }

    return this.taskModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();
  }

  async moveTask(moveTaskDto: MoveTaskDto): Promise<Task | null> {
    const { taskId, newStatus, newOrder } = moveTaskDto;

    // Update the moved task
    const task = await this.taskModel.findByIdAndUpdate(
      taskId,
      { status: newStatus, order: newOrder },
      { new: true }
    );

    // Reorder tasks in the new status column
    await this.reorderTasksInStatus(newStatus, taskId, newOrder);

    return this.taskModel
      .findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();
  }

  private async reorderTasksInStatus(
    status: TaskStatus,
    excludeTaskId: string,
    newOrder: number
  ): Promise<void> {
    const tasks = await this.taskModel
      .find({
        status,
        _id: { $ne: new Types.ObjectId(excludeTaskId) },
        order: { $gte: newOrder },
      })
      .exec();

    // Increment order for tasks that come after the new position
    for (const task of tasks) {
      await this.taskModel.findByIdAndUpdate(task._id, {
        $inc: { order: 1 },
      });
    }
  }

  async remove(id: string): Promise<Task | null> {
    return this.taskModel.findByIdAndDelete(id).exec();
  }
}





