import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from '../schemas/club.schema';
import mongoose from 'mongoose'; 


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

 async create(data: Partial<Club>) {
  const code = await this.generateUniqueCode();

  const { organizationId, ...rest } = data;

  return this.model.create({
    ...rest,
    code,
    organizationId: new Types.ObjectId(organizationId),
  });
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

    return result;
  }

 async updateClub(id: string, updateData: Partial<ClubDocument> & { id?: string }) {
  const { id: _, ...fields } = updateData;

  if (fields.organizationId && typeof fields.organizationId === 'string') {
    try {
      fields.organizationId = new Types.ObjectId(fields.organizationId);
    } catch (err) {
      console.error('Invalid organizationId:', fields.organizationId);
    }
  }
  console.log('Final fields before update:', fields);
  return this.model.findByIdAndUpdate(id, fields, { new: true }).exec();
}

async deleteMany(ids: (string | number)[]) {
  const objectIds = ids.map(id => new Types.ObjectId(id));
  const result = await this.model.deleteMany({ _id: { $in: objectIds } });
  return { deletedCount: result.deletedCount };
}
 
}