import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';
import { Invoice, InvoiceSchema } from '../schemas/invoice.schema';
import { GreenInvoiceService } from '../services/greenInvoice.service';
import { ICountService } from '../services/icount.service';
import { InvoiceService } from '../services/invoice.service';
import { InvoiceController } from '../controllers/invoice.controller';
import { PaymentModule } from './payment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Invoice.name, schema: InvoiceSchema }
    ]),
    forwardRef(() => PaymentModule)
  ],
  controllers: [InvoiceController],
  providers: [GreenInvoiceService, ICountService, InvoiceService],
  exports: [GreenInvoiceService, ICountService, InvoiceService],
})
export class InvoiceModule {}

