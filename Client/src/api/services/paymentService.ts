import { createApiService } from '../utils/apiFactory';

interface PaymentResponse {
  iframeUrl: string;
  transactionId: string;
}

interface CreatePaymentRequest {
  amount: number;
  description: string;
  dataString: string;
}

const paymentService = createApiService<PaymentResponse>('/payments', {
  includeOrgId: true,
});


export const createPaymentSession = async (data: CreatePaymentRequest): Promise<PaymentResponse> => {
  console.log(data, "data")
  const response = await paymentService.customRequest<PaymentResponse>(
    'post',
    '/payments/create-iframe',
    { data }
  );
  
  if (!response || typeof response === 'boolean') {
    throw new Error('Invalid response from payment service');
  }

  if ('status' in response && response.data) {
    return response.data;
  }

  if ('iframeUrl' in response && 'transactionId' in response) {
    return response;
  }

  throw new Error('Invalid response format from payment service');
};


export default paymentService; 