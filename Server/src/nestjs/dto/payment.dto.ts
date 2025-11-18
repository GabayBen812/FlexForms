import { 
    IsString, 
    IsNotEmpty, 
    IsMongoId, 
    IsOptional, 
    IsNumber, 
    IsEnum, 
    IsObject, 
    IsDateString,
    ValidateIf,
    registerDecorator,
    ValidationOptions,
    ValidationArguments
} from 'class-validator';
import { PaymentMethod } from '../schemas/payment.schema';

// Custom validator to ensure exactly one of payerContactId or payerAccountId is set
function ExactlyOnePayer(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'exactlyOnePayer',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const obj = args.object as any;
                    const hasContactId = !!obj.payerContactId;
                    const hasAccountId = !!obj.payerAccountId;
                    // XOR: exactly one must be true
                    return hasContactId !== hasAccountId;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Exactly one of payerContactId or payerAccountId must be provided';
                },
            },
        });
    };
}

export class CreatePaymentDto {
    @IsMongoId()
    @IsNotEmpty()
    organizationId!: string;

    @IsMongoId()
    @IsNotEmpty()
    formId!: string;

    @IsNumber()
    @IsNotEmpty()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    service!: string;

    @IsEnum(['paid', 'failed', 'pending'])
    @IsOptional()
    status?: 'paid' | 'failed' | 'pending';

    @IsString()
    @IsOptional()
    lowProfileCode?: string;

    @IsObject()
    @IsOptional()
    cardDetails?: {
        cardOwnerName: string;
        cardOwnerEmail: string;
        last4Digits: string;
        expiryMonth: string;
        expiryYear: string;
        token: string;
    };

    @IsMongoId()
    @IsOptional()
    invoiceId?: string;

    @IsDateString()
    @IsNotEmpty()
    paymentDate!: string;

    @IsEnum(PaymentMethod)
    @IsOptional()
    paymentMethod?: PaymentMethod;

    @IsMongoId()
    @IsOptional()
    @ExactlyOnePayer()
    payerContactId?: string;

    @IsMongoId()
    @IsOptional()
    @ExactlyOnePayer()
    payerAccountId?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdatePaymentDto {
    @IsMongoId()
    @IsOptional()
    organizationId?: string;

    @IsMongoId()
    @IsOptional()
    formId?: string;

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    service?: string;

    @IsEnum(['paid', 'failed', 'pending'])
    @IsOptional()
    status?: 'paid' | 'failed' | 'pending';

    @IsString()
    @IsOptional()
    lowProfileCode?: string;

    @IsObject()
    @IsOptional()
    cardDetails?: {
        cardOwnerName: string;
        cardOwnerEmail: string;
        last4Digits: string;
        expiryMonth: string;
        expiryYear: string;
        token: string;
    };

    @IsMongoId()
    @IsOptional()
    invoiceId?: string;

    @IsDateString()
    @IsOptional()
    paymentDate?: string;

    @IsEnum(PaymentMethod)
    @IsOptional()
    paymentMethod?: PaymentMethod;

    @IsMongoId()
    @IsOptional()
    @ExactlyOnePayer()
    payerContactId?: string;

    @IsMongoId()
    @IsOptional()
    @ExactlyOnePayer()
    payerAccountId?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
  