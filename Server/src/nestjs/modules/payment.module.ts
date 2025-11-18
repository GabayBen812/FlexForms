import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';
import { PaymentService } from '../services/payment.service';
import { PaymentController } from '../controllers/payment.controller';
import { RegistrationModule } from './registration.module';
import { GreenInvoiceService } from '../services/greenInvoice.service';
import { ICountService } from '../services/icount.service';
import { InvoiceModule } from './invoice.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Organization.name, schema: OrganizationSchema }
    ]),
    RegistrationModule,
    forwardRef(() => InvoiceModule)
  ],
  controllers: [PaymentController],
  providers: [PaymentService, GreenInvoiceService, ICountService],
  exports: [PaymentService],
})

export class PaymentModule {}
