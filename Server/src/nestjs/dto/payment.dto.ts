export class CreatePaymentDto {
    userId!: string;
    organizationId!: string;
    formId!: string;
    amount!: number;
    method!: string;
    status?: 'paid' | 'failed' | 'pending';
    transactionId?: string;
  }
  