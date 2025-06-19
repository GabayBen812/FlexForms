import { Controller, Post, Body, Get, Req, UseGuards, Param, BadRequestException, Query, Put } from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/organization.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';
import { CustomRequest } from '../dto/CustomRequest';
import { Types } from 'mongoose';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
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

  // Update organization name
  @Put(':id')
  async updateOrganizationName(
    @Param('id') id: string,
    @Body('name') name: string
  ) {
    if (!name || typeof name !== 'string') {
      throw new BadRequestException('Name is required');
    }
    return this.organizationService.updateName(id, name);
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
}
