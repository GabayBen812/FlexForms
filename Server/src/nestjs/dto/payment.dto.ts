export class CreatePaymentDto {
    organizationId!: string;
    formId!: string;
    amount!: number;
    service!: string;
    status?: 'paid' | 'failed' | 'pending';
    lowProfileCode?: string;
    cardDetails?: {
        cardOwnerName: string;
        cardOwnerEmail: string;
        last4Digits: string;
        expiryMonth: string;
        expiryYear: string;
        token: string;
    };
    invoice?: {
        id: string;
        originalDocumentUrl: string;
    };
}
  