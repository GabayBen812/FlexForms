import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from '../schemas/club.schema';


@Injectable()
export class ClubService {
  constructor(@InjectModel(Club.name) private model: Model<ClubDocument>) {}

  private async generateUniqueCode(): Promise<number> {
    let code = 0;
    let exists = true;
  
    while (exists) {
      code = Math.floor(100000 + Math.random() * 900000);
      exists = !!(await this.model.exists({ code }));
    }
  
    return code;
  }

  findAll() {
    return this.model.find().exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  async findByCode(@Query('code') code: string) {
    return this.model.findOne({ code: Number(code) }).exec();
  }

  findByOrganization(organizationId: string) {
    return this.model.find({ organizationId }).exec();
  }
  async findByOrganizationPaginated(organizationId: string, skip = 0, limit = 10) {
    const objectId = new Types.ObjectId(organizationId);
  const result = await this.model
    .find({ organizationId: objectId })
    .skip(skip)
    .limit(limit)
    .exec();

  console.log('Clubs found:', result);
  return result;
  }

 async updateClub(id: string, updateData: Partial<ClubDocument> & { id?: string }) {
  const { id: _, ...fields } = updateData;
  return this.model.findByIdAndUpdate(id, fields, { new: true }) .exec();
}
}