import { Controller, Post, Body, Get, Req, UseGuards, Param, BadRequestException, Query } from '@nestjs/common';
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
}
