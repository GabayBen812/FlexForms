import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { SeasonService } from '../services/season.service';
import { CreateSeasonDto, UpdateSeasonDto, ReorderSeasonDto } from '../dto/season.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('seasons')
@UseGuards(JwtAuthGuard)
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Post()
  create(@Body() createSeasonDto: CreateSeasonDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    createSeasonDto.organizationId = user.organizationId;
    return this.seasonService.create(createSeasonDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.seasonService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seasonService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSeasonDto: UpdateSeasonDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.seasonService.update(id, user.organizationId, updateSeasonDto);
  }

  @Put(':id/reorder')
  reorder(@Param('id') id: string, @Body() reorderSeasonDto: ReorderSeasonDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.seasonService.reorder(id, reorderSeasonDto.newOrder, user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.seasonService.remove(id, user.organizationId);
  }
}

