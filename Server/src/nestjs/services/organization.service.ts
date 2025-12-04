import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { Season, SeasonDocument } from '../schemas/season.schema';
import { UpdateOrganizationDto } from '../dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name) private model: Model<OrganizationDocument>,
    @InjectModel(Season.name) private seasonModel: Model<SeasonDocument>,
  ) {}

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
    // Populate the owner field with user data
    return this.model.find(filter).populate('owner', 'name email').exec();
  }

  async findById(id: string) {
    console.log("trying to find by id", id);
    
    const organization = await this.model.findById(id).exec();
    
    if (!organization) {
      return null;
    }
    
    // Convert to plain object and populate currentSeason manually
    const orgObj: any = organization.toObject ? organization.toObject() : organization;
    
    // Convert currentSeasonId to string if it exists
    if (orgObj.currentSeasonId) {
      const seasonIdString = orgObj.currentSeasonId.toString();
      orgObj.currentSeasonId = seasonIdString;
      
      // Manually populate currentSeason
      const season = await this.seasonModel.findById(seasonIdString).lean().exec();
      if (season) {
        orgObj.currentSeason = season;
      }
    }
    
    return orgObj;
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

  async update(orgId: string, update: UpdateOrganizationDto) {
    const updatePayload: Record<string, any> = {};

    if (update.name !== undefined) {
      if (typeof update.name !== 'string' || update.name.trim() === '') {
        throw new BadRequestException('Name must be a non-empty string');
      }
      updatePayload.name = update.name;
    }

    if (update.logo !== undefined) {
      updatePayload.logo = update.logo;
    }

    if (update.description !== undefined) {
      updatePayload.description = update.description;
    }

    if (update.paymentProvider !== undefined) {
      updatePayload.paymentProvider = update.paymentProvider;
    }

    if (update.paymentProviderCredentials !== undefined) {
      updatePayload.paymentProviderCredentials = update.paymentProviderCredentials;
    }

    if (update.recurringChargeDay !== undefined) {
      if (typeof update.recurringChargeDay !== 'number' || update.recurringChargeDay < 1 || update.recurringChargeDay > 31) {
        throw new BadRequestException('Recurring charge day must be a number between 1 and 31');
      }
      updatePayload.recurringChargeDay = update.recurringChargeDay;
    }

    if (update.invoicingProvider !== undefined) {
      updatePayload.invoicingProvider = update.invoicingProvider;
    }

    if (update.invoicingProviderApiKey !== undefined) {
      updatePayload.invoicingProviderApiKey = update.invoicingProviderApiKey;
    }

    if (update.icountCredentials !== undefined) {
      updatePayload.icountCredentials = update.icountCredentials;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    return this.model.findByIdAndUpdate(orgId, updatePayload, { new: true }).exec();
  }

  async remove(orgId: string) {
    return this.model.findByIdAndDelete(orgId).exec();
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

  async updateTableFieldDefinitions(
    orgId: string,
    tableFieldDefinitions: Record<string, any>
  ) {
    return this.model.findByIdAndUpdate(
      orgId,
      { tableFieldDefinitions },
      { new: true }
    ).exec();
  }

}
