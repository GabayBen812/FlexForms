import { Controller, Post, Body, Get, Req, UseGuards, Param, BadRequestException, Query, Put, Delete, UnauthorizedException } from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../dto/organization.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';
import { CustomRequest } from '../dto/CustomRequest';
import { Types } from 'mongoose';
import { Organization } from '../schemas/organization.schema';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    const createData: Partial<Organization> = {
      name: dto.name,
      description: dto.description,
    };
    
    if (dto.owner) {
      if (!Types.ObjectId.isValid(dto.owner)) {
        throw new BadRequestException('Invalid owner ID');
      }
      createData.owner = new Types.ObjectId(dto.owner) as Types.ObjectId;
    }
    
    return this.organizationService.create(createData);
  }

  @Get('find')
  async findMyOrg(@Req() req: CustomRequest) {
    const orgId = req.user?.organizationId;

    if (!orgId || typeof orgId !== 'string' || !Types.ObjectId.isValid(orgId)) {
      console.log("invalid orgId:", orgId, "typeof(orgId):", typeof orgId);
      throw new BadRequestException('Invalid organizationId');
    }

  
    const organization = await this.organizationService.findById(orgId);
  
    if (!organization) {
      throw new BadRequestException('Organization not found');
    }
  
    return organization;
  }
  
  
  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }
  
  @Get()
  async findAll(@Query() query: any) {
    return this.organizationService.findAll(query);
  }

  // Assign feature flags to an organization
  @Put(':id/feature-flags')
  async assignFeatureFlags(
    @Param('id') id: string,
    @Body() body: { featureFlagIds: string[] }
  ) {
    return this.organizationService.assignFeatureFlags(id, body.featureFlagIds);
  }

  // Remove a feature flag from an organization
  @Put(':id/feature-flags/remove')
  async removeFeatureFlag(
    @Param('id') id: string,
    @Body() body: { featureFlagId: string }
  ) {
    return this.organizationService.removeFeatureFlag(id, body.featureFlagId);
  }

@Get(':id/request-definitions')
async getRequestDefinitions(@Param('id') id: string) {
  const org = await this.organizationService.findById(id);
  if (!org) throw new BadRequestException("Organization not found");
  return org.requestDefinitions || {};
}
// עדכון
@Put(':id/request-definitions')
async updateRequestDefinitions(
  @Param('id') id: string,
  @Body() body: Record<string, any> // אפשר להחמיר עם טייפ מדויק יותר אם תרצי
) {
  return this.organizationService.updateRequestDefinitions(id, body);
}

@Get(':id/table-field-definitions')
async getTableFieldDefinitions(@Param('id') id: string) {
  const org = await this.organizationService.findById(id);
  if (!org) throw new BadRequestException("Organization not found");
  return org.tableFieldDefinitions || {};
}

@Put(':id/table-field-definitions')
async updateTableFieldDefinitions(
  @Param('id') id: string,
  @Body() body: Record<string, any>
) {
  return this.organizationService.updateTableFieldDefinitions(id, body);
}

  @Put(':id')
  async updateOrganization(
    @Param('id') id: string,
    @Body() body: UpdateOrganizationDto,
    @Req() req: CustomRequest
  ) {
    const userOrgId = req.user?.organizationId;

    if (!userOrgId || typeof userOrgId !== 'string' || !Types.ObjectId.isValid(userOrgId)) {
      throw new BadRequestException('Invalid organizationId in token');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid organization ID parameter');
    }

    // Verify that the user can only update their own organization
    if (id !== userOrgId) {
      throw new UnauthorizedException('You can only update your own organization');
    }

    return this.organizationService.update(id, body);
  }

  @Delete(':id')
  async deleteOrganization(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }
}
