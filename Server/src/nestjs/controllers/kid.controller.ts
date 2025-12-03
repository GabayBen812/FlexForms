import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Put, Query } from '@nestjs/common';
import { KidService } from '../services/kid.service';
import { CreateKidDto } from '../dto/kid.dto';
import { UpdateKidDto } from '../dto/kid.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('kids')
@UseGuards(JwtAuthGuard)
export class KidController {
  constructor(private readonly kidService: KidService) {}

  @Post()
  create(@Body() createKidDto: CreateKidDto, @Req() req: Request) {
    console.log('Received create kid request:', createKidDto);
    const user = req.user as { organizationId?: string };
    console.log('User from request:', user);
    if (user && user.organizationId) {
      createKidDto.organizationId = user.organizationId;
    } else {
      console.error('User organizationId not found');
      throw new Error('User organizationId not found');
    }
    console.log('Creating kid with data:', createKidDto);
    return this.kidService.create(createKidDto);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: any) {
    const user = req.user as { organizationId?: string; role?: string; id?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.kidService.findAll(user.organizationId, query, user.role, user.id);
  }

  @Get('count')
  async count(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    const count = await this.kidService.count(user.organizationId);
    return {
      status: 200,
      count,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kidService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateKidDto: UpdateKidDto) {
    return this.kidService.update(id, updateKidDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kidService.remove(id);
  }
}

