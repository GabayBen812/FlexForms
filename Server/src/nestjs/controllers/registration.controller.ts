import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { RegistrationService } from '../services/registration.service';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';

@Controller('registrations')
export class RegistrationController {
  constructor(private readonly service: RegistrationService) {}

  @Post()
  async create(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getByForm(@Query('formId') formId: string) {
    return this.service.findByFormId(formId);
  }
}
