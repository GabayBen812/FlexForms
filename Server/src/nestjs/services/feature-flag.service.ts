import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeatureFlag, FeatureFlagDocument } from '../schemas/feature-flag.schema';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, AssignFeatureFlagDto } from '../dto/feature-flag.dto';

@Injectable()
export class FeatureFlagService {
  constructor(
    @InjectModel(FeatureFlag.name) private model: Model<FeatureFlagDocument>
  ) {}

  async create(dto: CreateFeatureFlagDto, userId: string) {
    return this.model.create({
      ...dto,
      createdBy: new Types.ObjectId(userId)
    });
  }

  async findAll(query: any = {}) {
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { key: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }

    if (query.tags) {
      filter.tags = { $in: query.tags.split(',') };
    }

    if (query.isEnabled !== undefined) {
      filter.isEnabled = query.isEnabled === 'true';
    }

    return this.model.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();
  }

  async findById(id: string) {
    return this.model.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();
  }

  async findByKey(key: string) {
    return this.model.findOne({ key })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();
  }

  async update(id: string, dto: UpdateFeatureFlagDto, userId: string) {
    return this.model.findByIdAndUpdate(
      id,
      { 
        ...dto,
        updatedBy: new Types.ObjectId(userId)
      },
      { new: true }
    ).exec();
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async assignToOrganizations(id: string, dto: AssignFeatureFlagDto, userId: string) {
    return this.model.findByIdAndUpdate(
      id,
      { 
        $addToSet: { organizationIds: { $each: dto.organizationIds } },
        updatedBy: new Types.ObjectId(userId)
      },
      { new: true }
    ).exec();
  }

  async removeFromOrganizations(id: string, dto: AssignFeatureFlagDto, userId: string) {
    return this.model.findByIdAndUpdate(
      id,
      { 
        $pullAll: { organizationIds: dto.organizationIds },
        updatedBy: new Types.ObjectId(userId)
      },
      { new: true }
    ).exec();
  }

  async getOrganizationFeatureFlags(organizationId: string) {
    return this.model.find({
      $or: [
        { organizationIds: new Types.ObjectId(organizationId) },
        { isEnabled: true }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .exec();
  }

  async isFeatureEnabled(key: string, organizationId: string) {
    const feature = await this.model.findOne({
      key,
      $or: [
        { organizationIds: new Types.ObjectId(organizationId) },
        { isEnabled: true }
      ]
    }).exec();

    return !!feature;
  }
} 