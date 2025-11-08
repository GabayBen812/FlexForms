import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskController } from '../controllers/task.controller';
import { TaskService } from '../services/task.service';
import { Task, TaskSchema } from '../schemas/task.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }])],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}






