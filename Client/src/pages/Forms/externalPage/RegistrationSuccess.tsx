import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function RegistrationSuccess() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center max-w-md w-full">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-green-700">{t('registration_success')}</h1>
        <p className="text-gray-600 mb-6 text-center">
          {t('registration_success_message', 'ההרשמה בוצעה בהצלחה! תודה שנרשמת.')}<br/>
        </p>
      </div>
    </div>
  );
} 