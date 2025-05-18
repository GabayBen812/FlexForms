import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { CreateRoomDto } from '../dto/room.dto';
import { UpdateRoomDto } from '../dto/room.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { FeatureFlagGuard } from '../middlewares/feature-flag.guard';
import { FeatureFlag } from '../middlewares/feature-flag.decorator';
import { Request } from 'express';

@Controller('rooms')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  create(@Body() createRoomDto: CreateRoomDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (user && user.organizationId) {
      createRoomDto.organizationId = user.organizationId;
    } else {
      throw new Error('User organizationId not found');
    }
    return this.roomService.create(createRoomDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.roomService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }
} 