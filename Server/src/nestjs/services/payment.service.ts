import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { Model, Types } from 'mongoose';


@Injectable()
export class PaymentService {

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>
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
        SuccessRedirectUrl: "https://www.paradise-erp.com/payment/success",
        ErrorRedirectUrl: "https://www.paradise-erp.com/payment/error",
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

  create(data: Partial<Payment>) {
    return this.paymentModel.create({
      ...data,
    });
  }

  findByFormId(formId: string) {
    return this.paymentModel.find({ formId: new Types.ObjectId(formId) }).exec();
  }

  findByUserId(userId: string) {
    return this.paymentModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }
  findByLowProfile(lowProfileCode: string) {
    return this.paymentModel.find({ lowProfileCode: lowProfileCode }).exec();
  }

  findAll() {
    return this.paymentModel.find().exec();
  }
  async getInvoiceServiceCredentials(organizationId: string){
    const organization = await this.organizationModel.findById(organizationId);
    if (organization && organization.greenInvoiceCredentials){
      return organization.greenInvoiceCredentials
    }
    return null
  }
}
