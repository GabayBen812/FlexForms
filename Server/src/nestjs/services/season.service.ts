import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Season, SeasonDocument } from '../schemas/season.schema';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { CreateSeasonDto, UpdateSeasonDto, ReorderSeasonDto } from '../dto/season.dto';

@Injectable()
export class SeasonService {
  constructor(
    @InjectModel(Season.name) private seasonModel: Model<SeasonDocument>,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
  ) {}

  async create(createSeasonDto: CreateSeasonDto): Promise<Season> {
    const organizationId = this.asObjectId(createSeasonDto.organizationId);
    const nextOrder = await this.getNextOrder(organizationId);

    const seasonData: Partial<Season> & {
      organizationId: Types.ObjectId;
      order: number;
    } = {
      name: createSeasonDto.name,
      organizationId,
      order: nextOrder,
    };

    const season = new this.seasonModel(seasonData);
    await season.save();
    return season;
  }

  async findAll(organizationId: string): Promise<Season[]> {
    return this.seasonModel
      .find({ organizationId: new Types.ObjectId(organizationId) })
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Season | null> {
    return this.seasonModel.findById(id).exec();
  }

  async update(id: string, organizationId: string, updateSeasonDto: UpdateSeasonDto): Promise<Season | null> {
    const orgObjectId = this.asObjectId(organizationId);
    const season = await this.seasonModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId: orgObjectId,
    });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    if (updateSeasonDto.name !== undefined) {
      season.name = updateSeasonDto.name;
    }

    if (updateSeasonDto.order !== undefined && updateSeasonDto.order !== season.order) {
      await this.reorderSeason(season, orgObjectId, updateSeasonDto.order);
    }

    await season.save();
    return season;
  }

  async reorder(seasonId: string, newOrder: number, organizationId: string): Promise<Season | null> {
    const orgObjectId = this.asObjectId(organizationId);
    const season = await this.seasonModel.findOne({
      _id: new Types.ObjectId(seasonId),
      organizationId: orgObjectId,
    });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    await this.reorderSeason(season, orgObjectId, newOrder);
    return this.seasonModel.findById(seasonId).exec();
  }

  async remove(id: string, organizationId: string): Promise<Season | null> {
    const orgObjectId = this.asObjectId(organizationId);
    const season = await this.seasonModel
      .findOne({
        _id: new Types.ObjectId(id),
        organizationId: orgObjectId,
      })
      .exec();

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    await this.seasonModel.deleteOne({
      _id: new Types.ObjectId(id),
      organizationId: orgObjectId,
    });

    // Auto-reorder: decrement order of all seasons with higher order
    await this.seasonModel.updateMany(
      {
        organizationId: orgObjectId,
        order: { $gt: season.order },
      },
      { $inc: { order: -1 } },
    );

    return season;
  }

  private async reorderSeason(
    season: SeasonDocument,
    organizationId: Types.ObjectId,
    requestedOrder: number,
  ): Promise<void> {
    const normalizedOrder = await this.normalizeOrder(
      organizationId,
      season._id,
      requestedOrder,
    );

    if (normalizedOrder === season.order) {
      return;
    }

    if (normalizedOrder > season.order) {
      // Moving down: decrement orders of seasons between current and target
      await this.seasonModel.updateMany(
        {
          organizationId,
          _id: { $ne: season._id },
          order: { $gt: season.order, $lte: normalizedOrder },
        },
        { $inc: { order: -1 } },
      );
    } else {
      // Moving up: increment orders of seasons between target and current
      await this.seasonModel.updateMany(
        {
          organizationId,
          _id: { $ne: season._id },
          order: { $gte: normalizedOrder, $lt: season.order },
        },
        { $inc: { order: 1 } },
      );
    }

    season.order = normalizedOrder;
    await season.save();
  }

  private asObjectId(value: string | Types.ObjectId | undefined | null): Types.ObjectId {
    if (!value) {
      throw new BadRequestException('Missing identifier');
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    return new Types.ObjectId(value);
  }

  private async getNextOrder(
    organizationId: Types.ObjectId,
  ): Promise<number> {
    const count = await this.seasonModel.countDocuments({ organizationId });
    return count;
  }

  private async normalizeOrder(
    organizationId: Types.ObjectId,
    excludeSeasonId: Types.ObjectId | null,
    desiredOrder: number,
  ): Promise<number> {
    const query: Record<string, unknown> = {
      organizationId,
    };

    if (excludeSeasonId) {
      query._id = { $ne: excludeSeasonId };
    }

    const count = await this.seasonModel.countDocuments(query);
    if (desiredOrder < 0) return 0;
    if (desiredOrder > count) return count;
    return desiredOrder;
  }

  async setCurrentSeason(seasonId: string, organizationId: string): Promise<Organization | null> {
    const orgObjectId = this.asObjectId(organizationId);
    const seasonObjectId = this.asObjectId(seasonId);

    // Verify that the season belongs to this organization
    const season = await this.seasonModel.findOne({
      _id: seasonObjectId,
      organizationId: orgObjectId,
    });

    if (!season) {
      throw new NotFoundException('Season not found or does not belong to this organization');
    }

    // Update the organization's currentSeasonId
    const organization = await this.organizationModel.findByIdAndUpdate(
      orgObjectId,
      { currentSeasonId: seasonObjectId },
      { new: true }
    ).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }
}

