import { Controller, Get, Req, UseGuards,Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}
  // @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(
    @Query('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    console.log('Received request:', { organizationId, page, pageSize });
    if (!organizationId) return [];
    console.log("im yyyy");
    const skip = page && pageSize ? (page - 1) * pageSize : 0;
    const limit = pageSize ? Number(pageSize) : 10;
  
    return this.service.findByOrganizationPaginated(organizationId, skip, limit);
  }

  @Get('find')
  getMe(@Req() req: Request) {
    return req.user;
  }
  
  
}
