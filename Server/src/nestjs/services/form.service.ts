import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Form, FormDocument } from '../schemas/form.schema';
import { UserFromRequest } from '../types/Requests/UserFromRequest';

@Injectable()
export class FormService {
  constructor(@InjectModel(Form.name) private model: Model<FormDocument>) {}

  private async generateUniqueCode(): Promise<number> {
    let code = 0;
    let exists = true;
  
    while (exists) {
      code = Math.floor(100000 + Math.random() * 900000);
      exists = !!(await this.model.exists({ code }));
    }
  
    return code;
  }
  
  

  async create(data: Partial<Form>, user: UserFromRequest) {
    const code = await this.generateUniqueCode();
    const organizationId = new Types.ObjectId(user.organizationId);
  
    return this.model.create({
      ...data,
      code,
      organizationId,
    });
  }
  

  update(id: string, data: Partial<Form>) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
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

  async findByCode(@Query('code') code: string) {
    return this.model.findOne({ code: Number(code) }).exec();
  }
  
}
