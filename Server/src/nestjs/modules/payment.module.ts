import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';
import { PaymentService } from '../services/payment.service';
import { PaymentController } from '../controllers/payment.controller';
import { RegistrationModule } from './registration.module';
import { GreenInvoiceService } from '../services/greenInvoice.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Organization.name, schema: OrganizationSchema }
    ]),
    RegistrationModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService, GreenInvoiceService],
  exports: [PaymentService],
})

export class PaymentModule {}
