import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTaskColumnDto, UpdateTaskColumnDto } from '../dto/task-column.dto';
import { TaskColumn, TaskColumnDocument } from '../schemas/task-column.schema';
import { Task, TaskDocument } from '../schemas/task.schema';

const DEFAULT_COLUMNS = [
  { key: 'todo', name: 'tasks:status.todo', color: '#CBD5F5' },
  { key: 'in_progress', name: 'tasks:status.in_progress', color: '#FDE68A' },
  { key: 'in_review', name: 'tasks:status.in_review', color: '#FBCFE8' },
  { key: 'done', name: 'tasks:status.done', color: '#BBF7D0' },
];

@Injectable()
export class TaskColumnService {
  constructor(
    @InjectModel(TaskColumn.name)
    private readonly taskColumnModel: Model<TaskColumnDocument>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {}

  async ensureDefaultColumns(organizationId: Types.ObjectId): Promise<void> {
    const existingCount = await this.taskColumnModel.countDocuments({ organizationId });
    if (existingCount > 0) {
      return;
    }

    await this.taskColumnModel.insertMany(
      DEFAULT_COLUMNS.map((column, index) => ({
        organizationId,
        key: column.key,
        name: column.name,
        color: column.color,
        order: index,
      })),
    );
  }

  async findAllByOrganization(organizationId: Types.ObjectId): Promise<TaskColumn[]> {
    await this.ensureDefaultColumns(organizationId);
    return this.taskColumnModel
      .find({ organizationId })
      .sort({ order: 1 })
      .lean()
      .exec();
  }

  async createColumn(
    organizationId: Types.ObjectId,
    dto: CreateTaskColumnDto,
  ): Promise<TaskColumn> {
    const order = await this.taskColumnModel.countDocuments({ organizationId });
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Column name required');
    }
    const key = await this.generateUniqueKey(organizationId, name);
    const column = await this.taskColumnModel.create({
      organizationId,
      key,
      name,
      color: dto.color,
      order,
    });

    return column;
  }

  async updateColumn(
    organizationId: Types.ObjectId,
    columnId: string,
    dto: UpdateTaskColumnDto,
  ): Promise<TaskColumn> {
    const column = await this.taskColumnModel.findOne({
      _id: columnId,
      organizationId,
    });

    if (!column) {
      throw new NotFoundException('Task column not found');
    }

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) {
        throw new BadRequestException('Column name required');
      }
      column.name = trimmed;
    }
    if (dto.color !== undefined) {
      column.color = dto.color;
    }

    await column.save();
    return column;
  }

  async findByKey(organizationId: Types.ObjectId, key: string): Promise<TaskColumn | null> {
    return this.taskColumnModel.findOne({ organizationId, key }).exec();
  }

  async findById(organizationId: Types.ObjectId, columnId: string): Promise<TaskColumn | null> {
    if (!Types.ObjectId.isValid(columnId)) {
      return null;
    }
    return this.taskColumnModel.findOne({ organizationId, _id: new Types.ObjectId(columnId) }).exec();
  }

  async deleteColumn(organizationId: Types.ObjectId, columnId: string): Promise<void> {
    if (!Types.ObjectId.isValid(columnId)) {
      throw new BadRequestException('Invalid column id');
    }

    const columns = await this.taskColumnModel
      .find({ organizationId })
      .sort({ order: 1 })
      .exec();

    if (columns.length <= 1) {
      throw new BadRequestException('Cannot delete the last board');
    }

    const column = columns.find((col) => col._id.equals(columnId));
    if (!column) {
      throw new NotFoundException('Task column not found');
    }

    const taskCount = await this.taskModel.countDocuments({
      organizationId,
      status: column.key,
    });

    if (taskCount > 0) {
      throw new BadRequestException('Cannot delete a board that still contains tasks');
    }

    await this.taskColumnModel.deleteOne({ _id: column._id }).exec();

    let order = 0;
    for (const col of columns) {
      if (col._id.equals(column._id)) continue;
      await this.taskColumnModel.updateOne({ _id: col._id }, { order }).exec();
      order += 1;
    }
  }

  async reorderColumns(organizationId: Types.ObjectId, columnIds: string[]): Promise<void> {
    const existingColumns = await this.taskColumnModel
      .find({ organizationId })
      .sort({ order: 1 })
      .exec();

    if (existingColumns.length !== columnIds.length) {
      throw new BadRequestException('Invalid column order payload');
    }

    const existingIds = existingColumns.map((col) => col._id.toString());
    const payloadIdsSorted = [...columnIds].sort();
    const existingIdsSorted = [...existingIds].sort();

    if (payloadIdsSorted.some((id, index) => id !== existingIdsSorted[index])) {
      throw new BadRequestException('Column ids mismatch');
    }

    await Promise.all(
      columnIds.map((id, index) =>
        this.taskColumnModel.updateOne(
          { _id: new Types.ObjectId(id), organizationId },
          { order: index },
        ),
      ),
    );
  }

  private async generateUniqueKey(organizationId: Types.ObjectId, name: string): Promise<string> {
    const baseKey = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'column';

    let key = baseKey;
    let counter = 1;

    while (await this.taskColumnModel.exists({ organizationId, key })) {
      key = `${baseKey}_${counter}`;
      counter += 1;
      if (counter > 50) {
        throw new BadRequestException('Unable to generate unique column key');
      }
    }

    return key;
  }
}

