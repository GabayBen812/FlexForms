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

  async findAll(query: any = {}) {
    const sample = await this.model.findOne();
    console.log('Sample form document:', sample);
    console.log('Incoming query (forms):', query);
    const filter: any = {};

    // Global search (search input)
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    // Advanced search (field-specific)
    if (query.title) {
      filter.title = { $regex: query.title, $options: 'i' };
    }
    if (query.description) {
      filter.description = { $regex: query.description, $options: 'i' };
    }
    if (query.isActive !== undefined && query.isActive !== "") {
      filter.isActive = query.isActive;
    }
    if (query.createdAt) {
      filter.createdAt = { $regex: query.createdAt, $options: 'i' };
    }
    if (query.organizationId && query.organizationId !== "") {
      filter.organizationId = new Types.ObjectId(query.organizationId);
    }

    // Only add filters if value is not undefined or empty string
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });

    console.log('Constructed filter (forms):', filter);
    const results = await this.model.find(filter).exec();
    console.log('Results count (forms):', results.length);
    return results;
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
