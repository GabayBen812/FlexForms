import { Controller, Post, Body, Get, Param, Query, Inject, forwardRef, Put, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { RegistrationService } from '../services/registration.service';
import { InvoiceService } from '../services/invoice.service';
import { InvoiceStatus } from '../schemas/invoice.schema';
import {
  GreenInvoiceService,
} from '../services/greenInvoice.service';
import { ICountService } from '../services/icount.service';
import { CreatePaymentDto, UpdatePaymentDto } from '../dto/payment.dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

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
    private readonly icountService: ICountService,
    @Inject(forwardRef(() => InvoiceService)) private readonly invoiceService: InvoiceService,
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
      let invoiceId: Types.ObjectId | undefined;
      try {
        const isProccessed = (await this.service.findByLowProfile(lowProfileCode)).length;
        if (isProccessed){
          console.log(lowProfileCode)
          return { status: 200, message: "Transaction already proccessed" };
        }
        const invoiceServiceInfo = await this.service.getInvoiceServiceCredentials(dataObj.organizationId)
        if (invoiceServiceInfo){
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
            let invoiceResult: { id: string; originalDocumentUrl: string; fileName?: string | null };
            const invoiceData: any = {
              organizationId: new Types.ObjectId(dataObj.organizationId),
              formId: new Types.ObjectId(dataObj.formId),
              client: {
                name: cardOwnerName || "",
                personalId: cardOwnerID || "",
                email: cardOwnerEmail || "",
              },
              items: [
                {
                  name: description,
                  quantity: 1,
                  price: amountPaid,
                },
              ],
              subject: description,
              status: InvoiceStatus.PAID,
              paidAmount: amountPaid,
            };

            // Create invoice via the appropriate service based on provider
            if (invoiceServiceInfo.provider === 'icount') {
              invoiceResult = await this.icountService.createInvoiceReceipt(
                paymentCustomer,
                invoiceDetails,
                payment,
                invoiceServiceInfo.credentials
              );
              invoiceData.icount = {
                id: invoiceResult.id,
                originalDocumentUrl: invoiceResult.originalDocumentUrl,
                documentType: 'receipt',
              };
              if (invoiceResult.fileName) {
                invoiceData.externalInvoiceNumber = invoiceResult.fileName;
              }
            } else {
              // Default to GreenInvoice
              invoiceResult = await this.greenInvoiceService.createInvoiceReceipt(
                paymentCustomer,
                invoiceDetails,
                payment,
                invoiceServiceInfo.credentials
              );
              invoiceData.greenInvoice = {
                id: invoiceResult.id,
                originalDocumentUrl: invoiceResult.originalDocumentUrl,
                documentType: 320, // RECEIPT
              };
              if (invoiceResult.fileName) {
                invoiceData.externalInvoiceNumber = invoiceResult.fileName;
              }
            }

            const savedInvoice = await this.invoiceService.create(invoiceData);
            invoiceId = savedInvoice._id;
          } catch (error) {
            console.error("Failed to create invoice receipt:", error);
          }
        }
        // Create payment record with invoiceId reference
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
          invoiceId: invoiceId,
          paymentDate: new Date(),
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
      paymentDate: new Date(dto.paymentDate),
      ...(dto.invoiceId && { invoiceId: new Types.ObjectId(dto.invoiceId) }),
      ...(dto.payerContactId && { payerContactId: new Types.ObjectId(dto.payerContactId) }),
      ...(dto.payerAccountId && { payerAccountId: new Types.ObjectId(dto.payerAccountId) }),
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.service.update(id, dto);
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
  @UseGuards(JwtAuthGuard)
  async getAll(@Req() req: Request, @Query() query: any) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    return this.service.findAll(user.organizationId, query);
  }
}
