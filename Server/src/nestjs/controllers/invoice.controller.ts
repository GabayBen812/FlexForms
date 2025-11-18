import { Controller, Post, Body, Get, Put, Patch, Param, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { GreenInvoiceService, Customer, Invoice as GreenInvoice, Payment, CreateDocumentOptions } from '../services/greenInvoice.service';
import { ICountService, ICountCustomer, ICountInvoice, ICountPayment, ICountDocumentType, ICountLanguage } from '../services/icount.service';
import { InvoiceService } from '../services/invoice.service';
import { Invoice, InvoiceStatus } from '../schemas/invoice.schema';
import {
  CreateInvoiceDto,
  InvoiceDocumentType,
  InvoicePaymentType,
  DocumentTypeMap,
  PaymentTypeMap,
} from '../dto/invoice.dto';
import { DocumentType, Language, Currency, VatType } from '../services/greenInvoice.service';
import { PaymentService } from '../services/payment.service';

@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly greenInvoiceService: GreenInvoiceService,
    private readonly icountService: ICountService,
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
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

    // Get invoice service credentials based on provider
    const invoiceServiceInfo = await this.paymentService.getInvoiceServiceCredentials(dto.organizationId);
    
    if (!invoiceServiceInfo) {
      throw new BadRequestException(
        'Invoice service credentials are not configured for this organization. Please configure the invoice provider in organization settings.',
      );
    }

    console.log('Using invoice provider:', invoiceServiceInfo.provider);

    // Convert DTO to service interfaces
    const invoiceData: Partial<Invoice> = {
      organizationId: new Types.ObjectId(dto.organizationId),
      formId: dto.formId ? new Types.ObjectId(dto.formId) : undefined,
      client: {
        name: dto.client.name,
        personalId: dto.client.personalId,
        email: dto.client.email,
        phone: dto.client.phone,
        address: dto.client.address,
      },
      items: dto.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        vatType: item.vatType,
        description: item.description,
      })),
      subject: dto.subject,
      description: dto.description,
      language: dto.language || Language.HEBREW,
      currency: dto.currency || Currency.ILS,
      vatType: dto.vatType ?? VatType.NONE,
      invoiceDate: new Date(),
      status: InvoiceStatus.SENT,
      paidAmount: dto.payment.amount > 0 ? dto.payment.amount : 0,
    };

    try {
      let result: { id: string; originalDocumentUrl: string; fileName?: string | null };
      let providerId: string;
      let documentUrl: string;

      // Providers that use iCount API
      const icountProviders = ['icount'];
      // Providers that use GreenInvoice API (morning, invoice4u, revachit, greenInvoice all use the same API)
      const greenInvoiceProviders = ['greenInvoice', 'morning', 'invoice4u', 'revachit'];

      if (icountProviders.includes(invoiceServiceInfo.provider)) {
        // Convert to iCount types
        const icountCustomer: ICountCustomer = {
          name: dto.client.name,
          personalId: dto.client.personalId,
          email: dto.client.email,
          phone: dto.client.phone,
          address: dto.client.address,
        };

        const icountInvoice: ICountInvoice = {
          subject: dto.subject,
          description: dto.description,
          items: dto.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            description: item.description,
          })),
        };

        const icountPayment: ICountPayment = {
          date: new Date(dto.payment.date),
          amount: dto.payment.amount,
          type: dto.payment.type,
          currency: dto.payment.currency,
        };

        // Map document type
        const icountDocType =
          dto.documentType === InvoiceDocumentType.RECEIPT
            ? ICountDocumentType.RECEIPT
            : ICountDocumentType.INVOICE;

        console.log(`[InvoiceController] Creating invoice via iCount service for provider: ${invoiceServiceInfo.provider}`);
        result = await this.icountService.createDocumentRequest(
          icountCustomer,
          icountInvoice,
          icountPayment,
          icountDocType,
          invoiceServiceInfo.credentials,
          {
            language: dto.language === 'en' ? ICountLanguage.ENGLISH : ICountLanguage.HEBREW,
            currency: (dto.currency || Currency.ILS) as any,
          },
        );

        invoiceData.icount = {
          id: result.id,
          originalDocumentUrl: result.originalDocumentUrl,
          documentType: dto.documentType,
        };
        if (result.fileName) {
          invoiceData.externalInvoiceNumber = result.fileName;
        }
        providerId = result.id;
        documentUrl = result.originalDocumentUrl;
      } else if (greenInvoiceProviders.includes(invoiceServiceInfo.provider)) {
        // Use GreenInvoice service for all GreenInvoice-compatible providers
        const customer: Customer = {
          name: dto.client.name,
          personalId: dto.client.personalId,
          email: dto.client.email,
          phone: dto.client.phone,
          address: dto.client.address,
        };

        const invoice: GreenInvoice = {
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

        console.log(`[InvoiceController] Creating invoice via GreenInvoice service for provider: ${invoiceServiceInfo.provider}`);
        result = await this.greenInvoiceService.createDocumentRequest(
          customer,
          invoice,
          payment,
          options,
          invoiceServiceInfo.credentials,
        );

        invoiceData.greenInvoice = {
          id: result.id,
          originalDocumentUrl: result.originalDocumentUrl,
          documentType: DocumentTypeMap[dto.documentType],
        };
        if (result.fileName) {
          invoiceData.externalInvoiceNumber = result.fileName;
        }
        providerId = result.id;
        documentUrl = result.originalDocumentUrl;
      } else {
        // Fallback: if provider is not recognized, try GreenInvoice as default
        console.log(`[InvoiceController] Unknown provider "${invoiceServiceInfo.provider}", defaulting to GreenInvoice service`);
        const customer: Customer = {
          name: dto.client.name,
          personalId: dto.client.personalId,
          email: dto.client.email,
          phone: dto.client.phone,
          address: dto.client.address,
        };

        const invoice: GreenInvoice = {
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

        result = await this.greenInvoiceService.createDocumentRequest(
          customer,
          invoice,
          payment,
          options,
          invoiceServiceInfo.credentials,
        );

        invoiceData.greenInvoice = {
          id: result.id,
          originalDocumentUrl: result.originalDocumentUrl,
          documentType: DocumentTypeMap[dto.documentType],
        };
        if (result.fileName) {
          invoiceData.externalInvoiceNumber = result.fileName;
        }
        providerId = result.id;
        documentUrl = result.originalDocumentUrl;
      }

      const savedInvoice = await this.invoiceService.create(invoiceData);

      return {
        success: true,
        data: {
          id: savedInvoice._id.toString(),
          invoiceNumber: savedInvoice.invoiceNumber,
          providerId: providerId,
          documentUrl: documentUrl,
        },
      };
    } catch (error) {
      console.error('Error in invoice service:', error);
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

  @Get()
  async getInvoices(
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters: any = {};
    
    if (organizationId) {
      filters.organizationId = organizationId;
    }
    if (status) {
      filters.status = status;
    }
    if (fromDate) {
      filters.fromDate = new Date(fromDate);
    }
    if (toDate) {
      filters.toDate = new Date(toDate);
    }

    const invoices = await this.invoiceService.findAll(filters);
    return invoices;
  }

  @Get('organization/:orgId')
  async getInvoicesByOrganization(
    @Param('orgId') orgId: string,
    @Query('status') status?: InvoiceStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (fromDate) {
      filters.fromDate = new Date(fromDate);
    }
    if (toDate) {
      filters.toDate = new Date(toDate);
    }

    const invoices = await this.invoiceService.findByOrganization(orgId, filters);
    return invoices;
  }

  @Get(':id')
  async getInvoice(@Param('id') id: string) {
    try {
      const invoice = await this.invoiceService.findById(id);
      return invoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid invoice ID');
    }
  }

  @Get(':id/payments')
  async getInvoicePayments(@Param('id') id: string) {
    // Verify invoice exists
    await this.invoiceService.findById(id);
    
    const payments = await this.paymentService.findByInvoiceId(id);
    return payments;
  }

  @Put(':id')
  async updateInvoice(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateInvoiceDto>,
  ) {
    try {
      // Convert DTO data to invoice schema format if needed
      const invoiceUpdate: any = {};
      
      if (updateData.client) {
        invoiceUpdate.client = updateData.client;
      }
      if (updateData.items) {
        invoiceUpdate.items = updateData.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          vatType: item.vatType,
          description: item.description,
        }));
      }
      if (updateData.subject !== undefined) {
        invoiceUpdate.subject = updateData.subject;
      }
      if (updateData.description !== undefined) {
        invoiceUpdate.description = updateData.description;
      }
      if (updateData.language !== undefined) {
        invoiceUpdate.language = updateData.language;
      }
      if (updateData.currency !== undefined) {
        invoiceUpdate.currency = updateData.currency;
      }
      if (updateData.vatType !== undefined) {
        invoiceUpdate.vatType = updateData.vatType;
      }

      const updatedInvoice = await this.invoiceService.update(id, invoiceUpdate);
      return updatedInvoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update invoice');
    }
  }

  @Patch(':id/status')
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Body() body: { status: InvoiceStatus },
  ) {
    try {
      const updatedInvoice = await this.invoiceService.updateStatus(id, body.status);
      return updatedInvoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update invoice status');
    }
  }
}

