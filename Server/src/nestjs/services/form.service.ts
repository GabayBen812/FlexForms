import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Form, FormDocument } from '../schemas/form.schema';

@Injectable()
export class FormService {
  constructor(@InjectModel(Form.name) private model: Model<FormDocument>) {}

  create(data: Partial<Form>) {
    return this.model.create(data);
  }

  findAll() {
    return this.model.find().exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByOrganization(organizationId: string) {
    return this.model.find({ organizationId }).exec();
  }
}
