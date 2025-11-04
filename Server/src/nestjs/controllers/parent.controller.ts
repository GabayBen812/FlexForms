import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Put } from '@nestjs/common';
import { ParentService } from '../services/parent.service';
import { CreateParentDto } from '../dto/parent.dto';
import { UpdateParentDto } from '../dto/parent.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('parents')
@UseGuards(JwtAuthGuard)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Post()
  create(@Body() createParentDto: CreateParentDto, @Req() req: Request) {
    console.log('Received create parent request:', createParentDto);
    const user = req.user as { organizationId?: string };
    console.log('User from request:', user);
    if (user && user.organizationId) {
      createParentDto.organizationId = user.organizationId;
    } else {
      console.error('User organizationId not found');
      throw new Error('User organizationId not found');
    }
    console.log('Creating parent with data:', createParentDto);
    return this.parentService.create(createParentDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.parentService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parentService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateParentDto: UpdateParentDto) {
    return this.parentService.update(id, updateParentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parentService.remove(id);
  }
}

