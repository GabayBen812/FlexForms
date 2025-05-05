import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class PaymentService {
  constructor(@InjectModel(Payment.name) private model: Model<PaymentDocument>) {}

  create(data: Partial<Payment>) {
    return this.model.create(data);
  }

  findByFormId(formId: string) {
    return this.model.find({ formId: new Types.ObjectId(formId) }).exec();
  }

  findByUserId(userId: string) {
    return this.model.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  findAll() {
    return this.model.find().exec();
  }
}
