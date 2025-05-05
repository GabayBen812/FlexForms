import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration, RegistrationDocument } from '../schemas/registration.schema';
import { Types } from 'mongoose';

@Injectable()
export class RegistrationService {
  constructor(@InjectModel(Registration.name) private model: Model<RegistrationDocument>) {}

  create(data: Partial<Registration>) {
    return this.model.create(data);
  }

  findByFormId(formId: string) {
    return this.model.find({ formId: new Types.ObjectId(formId) }).exec();
  }

  findAll() {
    return this.model.find().exec();
  }
}
