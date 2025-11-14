import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { GreenInvoiceService, Customer, Invoice, Payment, CreateDocumentOptions } from '../services/greenInvoice.service';
import {
  CreateInvoiceDto,
  InvoiceDocumentType,
  InvoicePaymentType,
  DocumentTypeMap,
  PaymentTypeMap,
} from '../dto/invoice.dto';
import { DocumentType, Language, Currency, VatType } from '../services/greenInvoice.service';

@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly greenInvoiceService: GreenInvoiceService,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
  ) {}

  @Post()
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    console.log('Received invoice creation request:', JSON.stringify(dto, null, 2));
    
    // Validate organization exists
    const organization = await this.organizationModel.findById(dto.organizationId);
    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // Get GreenInvoice credentials - check both invoicingProviderApiKey and greenInvoiceCredentials (for backward compatibility)
    let credentials: { apiKey: string; secret: string } | undefined;
    
    console.log('Organization invoicingProviderApiKey:', organization.invoicingProviderApiKey);
    console.log('Organization greenInvoiceCredentials:', organization.greenInvoiceCredentials);
    
    if (organization.invoicingProviderApiKey?.apiKey && organization.invoicingProviderApiKey?.secret) {
      credentials = {
        apiKey: organization.invoicingProviderApiKey.apiKey,
        secret: organization.invoicingProviderApiKey.secret,
      };
      console.log('Using invoicingProviderApiKey credentials');
    } else if (organization.greenInvoiceCredentials?.apiKey && organization.greenInvoiceCredentials?.secret) {
      // Fallback to greenInvoiceCredentials for backward compatibility
      credentials = {
        apiKey: organization.greenInvoiceCredentials.apiKey,
        secret: organization.greenInvoiceCredentials.secret,
      };
      console.log('Using greenInvoiceCredentials (backward compatibility)');
    }

    if (!credentials) {
      console.log('No credentials found!');
      throw new BadRequestException(
        'GreenInvoice credentials are not configured for this organization. Please configure both API key and secret in organization settings.',
      );
    }

    const { apiKey, secret } = credentials;
    console.log('Credentials found, API Key exists:', !!apiKey, 'Secret exists:', !!secret);

    // Convert DTO to service interfaces
    const customer: Customer = {
      name: dto.client.name,
      personalId: dto.client.personalId,
      email: dto.client.email,
      phone: dto.client.phone,
      address: dto.client.address,
    };

    const invoice: Invoice = {
      subject: dto.subject,
      description: dto.description,
      items: dto.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        vatType: item.vatType,
        description: item.description,
      })),
    };

    const payment: Payment = {
      type: PaymentTypeMap[dto.payment.type],
      date: new Date(dto.payment.date),
      amount: dto.payment.amount,
      currency: dto.payment.currency,
    };

    const options: CreateDocumentOptions = {
      documentType: DocumentTypeMap[dto.documentType],
      language: dto.language || Language.HEBREW,
      currency: dto.currency || Currency.ILS,
      vatType: dto.vatType ?? VatType.NONE,
      subject: dto.subject,
      description: dto.description,
    };

    // Create invoice via GreenInvoice service
    try {
      console.log('Calling GreenInvoice service with options:', JSON.stringify(options, null, 2));
      console.log('Customer:', JSON.stringify(customer, null, 2));
      console.log('Invoice:', JSON.stringify(invoice, null, 2));
      console.log('Payment:', JSON.stringify(payment, null, 2));
      
      const result = await this.greenInvoiceService.createDocumentRequest(
        customer,
        invoice,
        payment,
        options,
        {
          apiKey,
          secret,
        },
      );

      console.log('GreenInvoice service returned:', JSON.stringify(result, null, 2));

      return {
        success: true,
        data: {
          id: result.id,
          documentUrl: result.originalDocumentUrl,
        },
      };
    } catch (error) {
      console.error('Error in GreenInvoice service:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

