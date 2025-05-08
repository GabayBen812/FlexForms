import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types  } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }
  
  async findByOrganizationPaginated(organizationId: string, skip = 0, limit = 10) {
    const objectId = new Types.ObjectId(organizationId);
  const result = await this.userModel
    .find({ organizationId: objectId })
    .skip(skip)
    .limit(limit)
    .exec();

  console.log('Users found:', result);
  return result;
  }
  async create(data: Partial<User>) {
    return this.userModel.create(data);
  }
}
