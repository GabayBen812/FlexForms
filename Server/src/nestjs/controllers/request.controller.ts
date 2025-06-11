import { Controller, Post, Body, Get, Query, Param} from '@nestjs/common';
import { RequestService } from '../services/request.service';
import { CreateRequestDto } from '../dto/request.dto';
import { Types } from 'mongoose';

@Controller('requests')
export class RequestController {
  constructor(private readonly service: RequestService) {}
@Get()
  async getByOrganization(@Query('organizationId') orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @Get('organization/:orgId')
  async getByOrganizationPath(@Param('orgId') orgId: string) {
    return this.service.findByOrganization(orgId);
  }
}