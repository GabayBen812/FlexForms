import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';
import { GreenInvoiceService } from '../services/greenInvoice.service';
import { InvoiceController } from '../controllers/invoice.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema }
    ])
  ],
  controllers: [InvoiceController],
  providers: [GreenInvoiceService],
  exports: [GreenInvoiceService],
})
export class InvoiceModule {}

