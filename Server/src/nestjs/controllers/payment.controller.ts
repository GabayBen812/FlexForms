import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { RegistrationService } from '../services/registration.service';
import {
  GreenInvoiceService,
} from '../services/greenInvoice.service';
import { CreatePaymentDto } from '../dto/payment.dto';
import { Types } from 'mongoose';

interface CreateIframeDto {
  amount: number;
  description: string;
  dataString: string;
}

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly service: PaymentService,
    private readonly registrationService: RegistrationService,
    private readonly greenInvoiceService: GreenInvoiceService,
  ) {}

  @Post('create-iframe')
  async createIframe(@Body() dto: CreateIframeDto) {
    return this.service.createPaymentIframe(
      dto.amount, 
      dto.description, 
      dto.dataString,
    );
  }

  @Get('cardcom/callback')
  async handlePaymentCallback(@Query() params: any) {
    // Handle the payment callback from Cardcom
    let { lowprofilecode, OperationResponseText, dataString, description } = params;
    const dataObj = JSON.parse(dataString);
    console.log("cardcom params:", params)
    console.log("cardcom data:", dataObj)

  
    const paymentUrl = await this.service.getPaymentDetails(lowprofilecode, dataObj.organizationId);
    const paymentParams = new URLSearchParams(paymentUrl);
    
    if (paymentParams.get("OperationResponseText") === "OK") {
      const cardOwnerName = paymentParams.get("CardOwnerName") || "";
      const cardOwnerEmail = paymentParams.get("CardOwnerEmail") || "";
      const cardOwnerID = paymentParams.get("CardOwnerID") || "";
      const lowProfileCode = paymentParams.get("lowprofilecode") || "";
      const Token = paymentParams.get("Token") || "";
      const CardValidityMonth = paymentParams.get("CardValidityMonth") || "";
      const CardValidityYear = paymentParams.get("CardValidityYear") || "";
      const amountPaidInAgorot = paymentParams.get("ExtShvaParams.Sum36");
      const Last4Numbers = paymentParams.get("ExtShvaParams.CardNumber5") || "";
      const amountPaid = parseInt(amountPaidInAgorot || '0') / 100
      let invoice;
      try {
        const isProccessed = (await this.service.findByLowProfile(lowProfileCode)).length;
        if (isProccessed){
          console.log(lowProfileCode)
          return { status: 200, message: "Transaction already proccessed" };
        }
        const invoiceCredentials = await this.service.getInvoiceServiceCredentials(dataObj.organizationId)
        if (invoiceCredentials){
          const paymentCustomer = {
            name: cardOwnerName || "",
            personalId: cardOwnerID || "",
            email: cardOwnerEmail || "",
          };

          const invoiceDetails = {
            subject: description,
            items: [
              {
                name: description,
                quantity: 1,
                price: amountPaid,
              },
            ],
          };

          const payment = {
            date: new Date(),
            amount: amountPaid,
            type: "אשראי"
          };
          try {
            invoice = await this.greenInvoiceService.createInvoiceReceipt(
              paymentCustomer,
              invoiceDetails,
              payment,
              invoiceCredentials
            );
          } catch (error) {
            console.error("Failed to create invoice receipt:", error);
          }
        }
        // Create payment record
        await this.service.create({
          formId: new Types.ObjectId(dataObj.formId),
          organizationId: new Types.ObjectId(dataObj.organizationId),
          amount: amountPaid,
          service: 'cardcom',
          status: 'paid',
          lowProfileCode,
          cardDetails: {
            cardOwnerName,
            cardOwnerEmail,
            last4Digits: Last4Numbers,
            expiryMonth: CardValidityMonth,
            expiryYear: CardValidityYear,
            token: Token
          },
          invoice
        });

        // Create registration
        await this.registrationService.create({
          formId: dataObj.formId,
          organizationId: dataObj.organizationId,
          fullName: dataObj.fullName,
          email: dataObj.email,
          phone: dataObj.phone,
          additionalData: {
            ...dataObj.additionalData,
            paymentDetails: {
              cardOwnerName,
              last4Digits: Last4Numbers,
              amountPaid: amountPaid,
              paymentDate: new Date(),
              lowProfileCode
            }
          }
        });
      } catch (error) {
        console.error('Error processing payment callback:', error);
        return { status: 500, message: "Failed to process payment" };
      }
    }
    
    return { status: 200, message: "Operation successful" };
  }

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.service.create({
      ...dto,
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
