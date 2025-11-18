import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskController } from '../controllers/task.controller';
import { TaskService } from '../services/task.service';
import { Task, TaskSchema } from '../schemas/task.schema';
import { TaskColumn, TaskColumnSchema } from '../schemas/task-column.schema';
import { TaskColumnService } from '../services/task-column.service';
import { TaskColumnController } from '../controllers/task-column.controller';
import { EmailModule } from './email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: TaskColumn.name, schema: TaskColumnSchema },
    ]),
    EmailModule
  ],
  controllers: [TaskController, TaskColumnController],
  providers: [TaskService, TaskColumnService],
  exports: [TaskService, TaskColumnService],
})
export class TaskModule {}








