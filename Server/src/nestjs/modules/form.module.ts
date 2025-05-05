import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Form, FormSchema } from '../schemas/form.schema';
import { FormService } from '../services/form.service';
import { FormController } from '../controllers/form.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Form.name, schema: FormSchema }])],
  providers: [FormService],
  controllers: [FormController],
  exports: [FormService],
})
export class FormModule {}
