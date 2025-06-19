import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
  
  async assignFeatureFlags(orgId: string, featureFlagIds: string[]) {
    return this.model.findByIdAndUpdate(
      orgId,
      { $addToSet: { featureFlagIds: { $each: featureFlagIds.map(id => new Types.ObjectId(id)) } } },
      { new: true }
    ).exec();
  }

  async removeFeatureFlag(orgId: string, featureFlagId: string) {
    return this.model.findByIdAndUpdate(
      orgId,
      { $pull: { featureFlagIds: new Types.ObjectId(featureFlagId) } },
      { new: true }
    ).exec();
  }

  async updateName(orgId: string, name: string) {
    return this.model.findByIdAndUpdate(
      orgId,
      { name },
      { new: true }
    ).exec();
  }

  async updateRequestDefinitions(
  orgId: string,
  requestDefinitions: Record<string, any>
) {
  return this.model.findByIdAndUpdate(
    orgId,
    { requestDefinitions },
    { new: true }
  ).exec();
}

}
