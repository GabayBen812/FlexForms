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
  async getByForm(
    @Query('formId') formId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10'
  ) {
    const pageNumber = parseInt(page, 10);
    const limit = parseInt(pageSize, 10);
    const skip = (pageNumber - 1) * limit;
  
    const [data, total] = await this.service.findByFormIdPaginated(formId, skip, limit);
  
    return {
      status: 200,
      data,
      total,
    };
  }
  
  
}
