import { Controller, Post, Body, Get, Query, Param, Put, Req, UseGuards } from '@nestjs/common';
import { FormService } from '../services/form.service';
import { CreateFormDto } from '../dto/form.dto';
import { Types } from 'mongoose';
import { UserFromRequest } from '../types/Requests/UserFromRequest';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { CustomRequest } from '../types/Requests/CustomRequest';

@UseGuards(JwtAuthGuard)
@Controller('forms')
export class FormController {
  constructor(private readonly service: FormService) {}

  @Post()
  async create(@Body() dto: CreateFormDto, @Req() req: CustomRequest) {
    return this.service.create(dto, req.user);
  }
  
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateFormDto) {
    return this.service.update(id, {
      ...dto,
      organizationId: new Types.ObjectId(dto.organizationId),
    });
  }

  @Get()
  async getAll() {
    return this.service.findAll();
  }
  @Get('find-by-code')
  async findByCode(@Query('code') code: string) {
    return this.service.findByCode(code);
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
