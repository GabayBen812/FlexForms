import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { RegistrationService } from '../services/registration.service';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';



@UseGuards(JwtAuthGuard)

@Controller('registrations')
export class RegistrationController {
  constructor(private readonly service: RegistrationService) {}

  @Post()
  async create(@Body() dto: CreateRegistrationDto) {
    return this.service.create({
      ...dto
    });
  }

  @Get()
  async getByForm(@Query('formId') formId: string) {
    return this.service.findByFormId(formId);
  }
}
