import { Controller, Post, Body, Get, Query, Param, Put, Req, UseGuards } from '@nestjs/common';
import { FormService } from '../services/form.service';
import { CreateFormDto } from '../dto/form.dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { CustomRequest } from '../types/Requests/CustomRequest';

@Controller('forms')
export class FormController {
  constructor(private readonly service: FormService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateFormDto, @Req() req: CustomRequest) {
    return this.service.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateFormDto) {
    return this.service.update(id, {
      ...dto,
      organizationId: new Types.ObjectId(dto.organizationId),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.service.findAll();
  }

  @Get('find-by-code')
  async findByCode(@Query('code') code: string) {
    return this.service.findByCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('organization/:orgId')
  async getByOrganization(@Param('orgId') orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
