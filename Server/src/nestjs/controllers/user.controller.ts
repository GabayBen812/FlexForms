import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { Request } from 'express';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}
  
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUsers(
    @Query('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    if (!organizationId) return [];
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
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const currentUser = req.user as any;
    
    // If password is being updated, ensure only system_admin can do it
    if (updateUserDto.password) {
      if (currentUser?.role !== 'system_admin') {
        throw new ForbiddenException('Only system_admin users can change passwords');
      }
    }

    // Get the target user to verify organization
    const targetUser = await this.service.findById(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Ensure the target user belongs to the same organization
    if (currentUser?.organizationId !== targetUser.organizationId.toString()) {
      throw new ForbiddenException('Cannot update users from other organizations');
    }

    const updatedUser = await this.service.updateUser(id, updateUserDto);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const currentUser = req.user as any;
    
    // Get the target user to verify organization
    const targetUser = await this.service.findById(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Ensure the target user belongs to the same organization
    if (currentUser?.organizationId !== targetUser.organizationId.toString()) {
      throw new ForbiddenException('Cannot delete users from other organizations');
    }

    const deletedUser = await this.service.remove(id);
    
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully', id };
  }
}
