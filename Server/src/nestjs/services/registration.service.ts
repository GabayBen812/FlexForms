import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration, RegistrationDocument } from '../schemas/registration.schema';
import { CreateRegistrationDto } from '../dto/registration.dto';

@Injectable()
export class RegistrationService {
  constructor(@InjectModel(Registration.name) private model: Model<RegistrationDocument>) {}

  async create(data: CreateRegistrationDto) {
    try {
      const formId = new Types.ObjectId(data.formId);
      const organizationId = new Types.ObjectId(data.organizationId);

      const registration = {
        formId,
        organizationId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        additionalData: data.additionalData || {},
      };

      const result = await this.model.create(registration);
      return result;
    } catch (err) {
      console.error("Error while saving registration:", err);
      throw err;
    }
  }

  async findByFormId(formId: string) {
    return this.model.find({ formId: new Types.ObjectId(formId) }).exec();
  }

  async findAll(query: any = {}) {
    const filter: any = {};
    // Global search (search input)
    if (query.search) {
      filter.fullName = { $regex: query.search, $options: 'i' };
    }
    // Advanced search (field-specific)
    if (query.fullName) {
      filter.fullName = { $regex: query.fullName, $options: 'i' };
    }
    if (query.email) {
      filter.email = { $regex: query.email, $options: 'i' };
    }
    if (query.phone) {
      filter.phone = { $regex: query.phone, $options: 'i' };
    }
    if (query.formId && Types.ObjectId.isValid(query.formId)) {
      filter.formId = new Types.ObjectId(query.formId);
    }
    if (query.organizationId && Types.ObjectId.isValid(query.organizationId)) {
      filter.organizationId = new Types.ObjectId(query.organizationId);
    }
    // Support filtering on additionalData fields (dot notation)
    Object.keys(query).forEach(key => {
      if (key.startsWith('additionalData.') && query[key]) {
        filter[key] = { $regex: query[key], $options: 'i' };
      }
    });
    // Remove empty filters
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });
    return this.model.find(filter).exec();
  }

  async findPaginatedWithFilters(query: any, skip: number, limit: number) {
    const filter: any = {};
    // Global search (search input)
    if (query.search) {
      filter.fullName = { $regex: query.search, $options: 'i' };
    }
    // Advanced search (field-specific)
    if (query.fullName) {
      filter.fullName = { $regex: query.fullName, $options: 'i' };
    }
    if (query.email) {
      filter.email = { $regex: query.email, $options: 'i' };
    }
    if (query.phone) {
      filter.phone = { $regex: query.phone, $options: 'i' };
    }
    if (query.formId && Types.ObjectId.isValid(query.formId)) {
      filter.formId = new Types.ObjectId(query.formId);
    }
    if (query.organizationId && Types.ObjectId.isValid(query.organizationId)) {
      filter.organizationId = new Types.ObjectId(query.organizationId);
    }
    Object.keys(query).forEach(key => {
      if (key.startsWith('additionalData.') && query[key]) {
        filter[key] = { $regex: query[key], $options: 'i' };
      }
    });
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });
    const [data, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return [data, total];
  }

  async countNumOfRegisteringByFormIds(formIds: string[]) {
    const objectIds = formIds.map(id => new Types.ObjectId(id));
    const result = await this.model.aggregate([
      { $match: { formId: { $in: objectIds } } },
      { $group: { _id: '$formId', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    result.forEach(entry => {
      counts[entry._id.toString()] = entry.count;
    });
    return counts;
  }

}

