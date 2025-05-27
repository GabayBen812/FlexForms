import { useSearchParams } from 'react-router-dom';

export default function PaymentError() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('statuscode') || '';
  const errorMessage = getErrorMessage(errorCode);



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            Payment Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    '001': 'Transaction declined by bank',
    '002': 'Invalid card number',
    '003': 'Card expired',
    '004': 'Invalid CVV',
  };

  return errorMessages[code] || 'An error occurred during payment. Please try again or contact support.';
} 