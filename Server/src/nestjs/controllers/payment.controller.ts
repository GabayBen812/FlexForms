import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dto/payment.dto';
import { Types } from 'mongoose';

@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.service.create({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
      organizationId: new Types.ObjectId(dto.organizationId),
      formId: new Types.ObjectId(dto.formId),
    });
  }

  @Get('form/:formId')
  async getByForm(@Param('formId') formId: string) {
    return this.service.findByFormId(formId);
  }

  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get()
  async getAll() {
    return this.service.findAll();
  }
}
