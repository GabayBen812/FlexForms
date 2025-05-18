import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto } from '../dto/feature-flag.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { RolesGuard } from '../middlewares/roles.guard';
import { Roles } from '../middlewares/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @Roles('system_admin')
  create(@Body() dto: CreateFeatureFlagDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User not found in request');
    return this.featureFlagService.create(dto, userId);
  }

  @Get()
  @Roles('system_admin', 'admin')
  async findAll(@Query() query: any) {
    const results = await this.featureFlagService.findAll(query);
    return {
      data: results,
      totalCount: results.length,
      totalPages: 1, // Update this if you add real pagination
    };
  }

  @Get('organization/:organizationId')
  @Roles('system_admin', 'admin')
  getOrganizationFeatureFlags(@Param('organizationId') organizationId: string) {
    return this.featureFlagService.getOrganizationFeatureFlags(organizationId);
  }

  @Get('check/:key/:organizationId')
  @Roles('system_admin', 'admin')
  isFeatureEnabled(
    @Param('key') key: string,
    @Param('organizationId') organizationId: string
  ) {
    return this.featureFlagService.isFeatureEnabled(key, organizationId);
  }

  @Get(':id')
  @Roles('system_admin', 'admin')
  findOne(@Param('id') id: string) {
    return this.featureFlagService.findById(id);
  }

  @Put(':id')
  @Roles('system_admin')
  update(@Param('id') id: string, @Body() dto: UpdateFeatureFlagDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User not found in request');
    return this.featureFlagService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('system_admin')
  delete(@Param('id') id: string) {
    return this.featureFlagService.delete(id);
  }
} 