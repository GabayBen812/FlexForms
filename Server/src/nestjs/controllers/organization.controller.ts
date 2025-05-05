import { Controller, Post, Body, Get, Req, UseGuards, Param, BadRequestException } from '@nestjs/common';
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
  
    if (!orgId || !Types.ObjectId.isValid(orgId)) {
      throw new BadRequestException('Invalid organizationId');
    }
  
    return this.organizationService.findById(orgId); 
  }
  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }
  
  @Get()
  findAll() {
    return this.organizationService.findAll();
  }
}
