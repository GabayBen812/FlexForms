import { Controller, Post, Body, Get, Query, Delete, UseGuards } from '@nestjs/common';
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
    @Query() query: any
  ) {
    const pageNumber = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.pageSize ?? '10', 10);
    const skip = (pageNumber - 1) * limit;
    // Remove page and pageSize from query before passing to service
    const { page, pageSize, ...filters } = query;
    const [data, total] = await this.service.findPaginatedWithFilters(filters, skip, limit);
    return {
      status: 200,
      data,
      total,
    };
  }
 @Get('/count-by-form-ids')
  async countByFormIds(@Query('formIds') formIds: string) {
    console.log('Received formIds:', formIds);
  const ids = formIds.split(',');
  const result = await this.service.countNumOfRegisteringByFormIds(ids);
  return {
    status: 200,
    data: result,
  };
}

  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteMany(@Body('ids') ids: (string | number)[]) {
    console.log('Delete request for IDs:', ids);
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return { status: 400, message: 'No IDs provided for deletion' };
    }
    return this.service.deleteMany(ids);
  }
}
