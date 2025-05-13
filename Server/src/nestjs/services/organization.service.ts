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

  async findAll(query: any = {}) {
    console.log('Incoming query:', query);
    const filter: any = {};

    // Global search (search input)
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    // Advanced search (field-specific)
    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query.description) {
      filter.description = { $regex: query.description, $options: 'i' };
    }
    if (query.owner) {
      filter.owner = { $regex: query.owner, $options: 'i' };
    }

    // Only add filters if value is not undefined and not empty string
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });

    console.log('Constructed filter:', filter);
    return this.model.find(filter).exec();
  }

  async findById(id: string) {
    console.log("trying to find by id", id);
    
    return this.model.findById(id).exec();
  }
  
}
