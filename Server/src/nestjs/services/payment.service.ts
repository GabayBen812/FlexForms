import { Injectable, BadRequestException, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { InvoiceService } from './invoice.service';
import { FilterQuery, Model, Types } from 'mongoose';
import { UpdatePaymentDto } from '../dto/payment.dto';


@Injectable()
export class PaymentService {

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @Inject(forwardRef(() => InvoiceService)) private invoiceService: InvoiceService,
  ) {}

  async createPaymentIframe(amount: number, description: string, dataString: string) {

    const dataObj = JSON.parse(dataString)
    const organization = await this.organizationModel.findById(dataObj.organizationId);

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const terminalNumber = organization.cardcomTerminalNumber;
    const username = organization.cardcomUsername;

    if (!terminalNumber || !username) {
      throw new BadRequestException('Cardcom credentials are not properly configured for this organization');
    }

    try {
      // Cardcom API parameters
      const params = {
        TerminalNumber: terminalNumber,
        UserName: username,
        APILevel: '10',
        CodePage: '65001', // UTF-8
        Operation: '2', // Token payment
        Language: 'he',
        CoinID: '1', // NIS
        SumToBill: amount.toString(),
        ProductName: description,
        SuccessRedirectUrl: "https://www.Paradize-erp.com/payment/success",
        ErrorRedirectUrl: "https://www.Paradize-erp.com/payment/error",
        IndicatorUrl: `https://flexforms-production.up.railway.app/payments/cardcom/callback?dataString=${dataString}&description=${description}`,
      };

      // Build the iframe URL with query parameters
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const iframeUrl = `${'https://secure.cardcom.solutions/Interface/LowProfile.aspx'}?${queryString}`;
      const transactionId = Date.now().toString(); // You might want to generate a proper transaction ID

      return {
        iframeUrl,
        transactionId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new Error('Failed to create payment iframe: ' + errorMessage);
    }
  }


  async getPaymentDetails(
    lowprofilecode: string="1fb8d56a-5c97-4a9b-8026-8f3483a70640",
    organizationId: string,
  ) {
    const organization = await this.organizationModel.findById(organizationId);

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const terminalNumber = organization.cardcomTerminalNumber;
    const username = organization.cardcomUsername;
    let urlToSend =
      "https://secure.cardcom.solutions/Interface/BillGoldGetLowProfileIndicator.aspx";
    urlToSend += "?terminalnumber=" + terminalNumber;
    urlToSend += "&username=" + username;
    urlToSend += "&lowprofilecode=" + lowprofilecode;
    urlToSend += "&codepage=" + "65001";

    let res = "";
    try {
      const response = await fetch(urlToSend);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.text();
      res = data;
    } catch (err) {
      console.log(err);
    }
    return res;
  }

  async create(data: Partial<Payment>) {
    const payment = await this.paymentModel.create({
      ...data,
      paymentDate: data.paymentDate || new Date(),
    });

    // If invoiceId is provided, link the payment to the invoice
    if (data.invoiceId) {
      try {
        await this.invoiceService.addPayment(data.invoiceId.toString(), data.amount || 0);
      } catch (error) {
        console.error('Failed to link payment to invoice:', error);
        // Don't throw - payment was created successfully
      }
    }

    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment id');
    }

    const updateData: Record<string, unknown> = { ...dto };

    const mapToObjectId = (value?: string) =>
      value ? new Types.ObjectId(value) : undefined;

    if (dto.organizationId) {
      updateData.organizationId = mapToObjectId(dto.organizationId);
    }
    if (dto.formId) {
      updateData.formId = mapToObjectId(dto.formId);
    }
    if (dto.invoiceId) {
      updateData.invoiceId = mapToObjectId(dto.invoiceId);
    }
    if (dto.payerContactId) {
      updateData.payerContactId = mapToObjectId(dto.payerContactId);
    }
    if (dto.payerAccountId) {
      updateData.payerAccountId = mapToObjectId(dto.payerAccountId);
    }
    if (dto.paymentDate) {
      updateData.paymentDate = new Date(dto.paymentDate);
    }

    const filter: FilterQuery<PaymentDocument> = { _id: new Types.ObjectId(id) };
    if (dto.organizationId) {
      filter.organizationId = mapToObjectId(dto.organizationId);
    }

    const updatedPayment = await this.paymentModel
      .findOneAndUpdate(
        filter,
        { $set: updateData },
        { new: true },
      )
      .populate('invoiceId');

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found or does not belong to organization');
    }

    return updatedPayment;
  }

  findByFormId(formId: string) {
    return this.paymentModel
      .find({ formId: new Types.ObjectId(formId) })
      .populate('invoiceId')
      .exec();
  }

  findByUserId(userId: string) {
    return this.paymentModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('invoiceId')
      .exec();
  }

  findByLowProfile(lowProfileCode: string) {
    return this.paymentModel
      .find({ lowProfileCode: lowProfileCode })
      .populate('invoiceId')
      .exec();
  }

  findByInvoiceId(invoiceId: string) {
    return this.paymentModel
      .find({ invoiceId: new Types.ObjectId(invoiceId) })
      .sort({ paymentDate: -1 })
      .exec();
  }

  findAll() {
    return this.paymentModel.find().populate('invoiceId').exec();
  }
  async getInvoiceServiceCredentials(organizationId: string): Promise<{ provider: string; credentials: any } | null> {
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization) {
      console.log(`[getInvoiceServiceCredentials] Organization not found: ${organizationId}`);
      return null;
    }

    const invoicingProvider = organization.invoicingProvider;
    console.log(`[getInvoiceServiceCredentials] Checking credentials for org ${organizationId}, provider: ${invoicingProvider}`);
    console.log(`[getInvoiceServiceCredentials] iCount credentials exist: ${!!organization.icountCredentials?.apiKey}`);
    console.log(`[getInvoiceServiceCredentials] invoicingProviderApiKey exists: ${!!(organization.invoicingProviderApiKey?.apiKey && organization.invoicingProviderApiKey?.secret)}`);
    console.log(`[getInvoiceServiceCredentials] greenInvoiceCredentials exists: ${!!(organization.greenInvoiceCredentials?.apiKey && organization.greenInvoiceCredentials?.secret)}`);

    // Providers that use GreenInvoice API (apiKey + secret)
    const greenInvoiceCompatibleProviders = ['greenInvoice', 'morning', 'invoice4u', 'revachit'];
    
    // Priority 1: If provider is explicitly set to 'icount', check iCount credentials first
    if (invoicingProvider === 'icount') {
      if (organization.icountCredentials?.apiKey) {
        console.log(`[getInvoiceServiceCredentials] Returning iCount credentials (provider explicitly set to icount)`);
        return {
          provider: 'icount',
          credentials: organization.icountCredentials,
        };
      }
      // If provider is icount but no icount credentials, return null (don't fallback)
      console.log(`[getInvoiceServiceCredentials] Provider set to icount but no iCount credentials found`);
      return null;
    }

    // Priority 2: Check for GreenInvoice-compatible credentials (new format) for any provider that uses GreenInvoice API
    if (organization.invoicingProviderApiKey?.apiKey && organization.invoicingProviderApiKey?.secret) {
      // If provider is set and is GreenInvoice-compatible, use that provider name
      // Otherwise default to 'greenInvoice' for backward compatibility
      const provider = (invoicingProvider && greenInvoiceCompatibleProviders.includes(invoicingProvider)) 
        ? invoicingProvider 
        : 'greenInvoice';
      
      console.log(`[getInvoiceServiceCredentials] Returning ${provider} credentials from invoicingProviderApiKey`);
      return {
        provider: provider,
        credentials: {
          apiKey: organization.invoicingProviderApiKey.apiKey,
          secret: organization.invoicingProviderApiKey.secret,
        },
      };
    }

    // Priority 3: Check for legacy GreenInvoice credentials
    if (organization.greenInvoiceCredentials?.apiKey && organization.greenInvoiceCredentials?.secret) {
      // If provider is set and is GreenInvoice-compatible, use that provider name
      // Otherwise default to 'greenInvoice' for backward compatibility
      const provider = (invoicingProvider && greenInvoiceCompatibleProviders.includes(invoicingProvider)) 
        ? invoicingProvider 
        : 'greenInvoice';
      
      console.log(`[getInvoiceServiceCredentials] Returning ${provider} credentials from legacy greenInvoiceCredentials`);
      return {
        provider: provider,
        credentials: organization.greenInvoiceCredentials,
      };
    }

    // Priority 4: If no provider is set, check iCount as fallback
    if (!invoicingProvider && organization.icountCredentials?.apiKey) {
      console.log(`[getInvoiceServiceCredentials] Returning iCount credentials (no provider set, using iCount as fallback)`);
      return {
        provider: 'icount',
        credentials: organization.icountCredentials,
      };
    }

    console.log(`[getInvoiceServiceCredentials] No valid credentials found for organization ${organizationId}`);
    return null;
  }
}
