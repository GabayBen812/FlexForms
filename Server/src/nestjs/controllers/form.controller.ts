import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { FormService } from '../services/form.service';
import { CreateFormDto } from '../dto/form.dto';
import { Types } from 'mongoose';

@Controller('forms')
export class FormController {
  constructor(private readonly service: FormService) {}

  @Post()
  async create(@Body() dto: CreateFormDto) {
    return this.service.create({
      ...dto,
      organizationId: new Types.ObjectId(dto.organizationId),
    });
  }

  @Get()
  async getAll() {
    return this.service.findAll();
  }

  @Get('organization/:orgId')
  async getByOrganization(@Param('orgId') orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
