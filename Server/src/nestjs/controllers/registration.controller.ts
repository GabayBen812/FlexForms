import { Controller, Post, Body, Get, Query, Delete, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { RegistrationService } from '../services/registration.service';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { ExtendedRequest } from '../../types/users/usersRequests';

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
  async countByFormIds(
    @Query('formIds') formIds: string,
    @Query('organizationId') organizationId?: string
  ) {
    console.log('Received formIds:', formIds);
    console.log('Received organizationId:', organizationId);
    const ids = formIds.split(',').filter(id => id && id.trim() !== '');
    const result = await this.service.countNumOfRegisteringByFormIds(ids, organizationId);
    console.log('Count result:', result);
    return {
      status: 200,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/export-pdf')
  async exportToPdf(
    @Body() body: { registrationIds: string[]; language: 'en' | 'he'; translations: any },
    @Req() req: ExtendedRequest,
    @Res() res: Response
  ) {
    try {
      const { registrationIds, language, translations } = body;

      if (!registrationIds || registrationIds.length === 0) {
        return res.status(400).json({
          status: 400,
          message: 'No registrations specified for export',
        });
      }

      // Validate translations object
      if (!translations || typeof translations !== 'object') {
        return res.status(400).json({
          status: 400,
          message: 'Translations object is required',
        });
      }

      // Generate PDF(s)
      const result = await this.service.exportToPdf(registrationIds, language, translations);

      // Set response headers with properly encoded filename
      res.setHeader('Content-Type', result.contentType);
      
      // Use RFC 5987 encoding for filenames with special characters
      const encodedFilename = encodeURIComponent(result.filename);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('Content-Length', result.buffer.length);

      // Send the buffer
      return res.send(result.buffer);
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      return res.status(500).json({
        status: 500,
        message: error?.message || 'Failed to export to PDF',
      });
    }
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
