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
    const filter = { ...query.filter };

    if (filter.formId && Types.ObjectId.isValid(filter.formId)) {
      filter.formId = new Types.ObjectId(filter.formId);
    }

    if (filter.organizationId && Types.ObjectId.isValid(filter.organizationId)) {
      filter.organizationId = new Types.ObjectId(filter.organizationId);
    }

    return this.model.find(filter).exec();
  }


  async findByFormIdPaginated(formId: string, skip: number, limit: number) {
    const [data, total] = await Promise.all([
      this.model
        .find({ formId: new Types.ObjectId(formId) })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.model.countDocuments({ formId: new Types.ObjectId(formId) }),
    ]);
  
    return [data, total];
  }
}

