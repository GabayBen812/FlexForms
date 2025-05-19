import { Controller, Post, Body, Get, Query, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ClubService } from '../services/clubs.service';
import { CreateClubDto , UpdateClubDto} from '../dto/club.dto';
import { Types } from 'mongoose';
import { UserFromRequest } from '../types/Requests/UserFromRequest';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { CustomRequest } from '../types/Requests/CustomRequest';


@Controller('clubs')
export class ClubController {
  constructor(private readonly service: ClubService) {}

  @Post()
    async create(@Body() dto: CreateClubDto) {
      console.log('Received request:', dto);
      return this.service.create(dto);
    }

  @Get()
  async getClubs(
    @Query('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    console.log('Received request:', { organizationId, page, pageSize });
    if (!organizationId) return [];
    const skip = page && pageSize ? (page - 1) * pageSize : 0;
    const limit = pageSize ? Number(pageSize) : 10;
  
    return this.service.findByOrganizationPaginated(organizationId, skip, limit);
  }

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

 @Put(':id')
async updateClub(@Param('id') id: string, @Body() updateData: UpdateClubDto){
  console.log('Update data:', id, updateData);
  return this.service.updateClub(id, updateData);
}

}