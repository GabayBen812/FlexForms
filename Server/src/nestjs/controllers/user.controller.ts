import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { Request } from 'express';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';

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

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.service.create(createUserDto);
  }

  @Get('find')
  getMe(@Req() req: Request) {
    return req.user;
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.service.updateUser(id, updateUserDto);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }
}
