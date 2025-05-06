import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';

@Injectable()
export class OrganizationService {
  constructor(@InjectModel(Organization.name) private model: Model<OrganizationDocument>) {}

  create(data: Partial<Organization>) {
    return this.model.create(data);
  }

  async findByUserId(userId: string) {
    return this.model.findOne({ owner: userId }).exec();
  }

  findAll() {
    return this.model.find().exec();
  }

  async findById(id: string) {
    console.log("trying to find by id", id);
    
    return this.model.findById(id).exec();
  }
  
}
