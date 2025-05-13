import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationsTable from './OrganizationsTable';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'system_admin')) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return <div className="p-8 text-center">Loading...</div>;
  if (user.role !== 'system_admin') return null;

  return (
    <div className="p-2 w-full">
      <h1 className="text-3xl font-bold mb-6">{t('admin_dashboard')}</h1>
      <p className="mb-8">{t('admin_welcome', { name: user.name })}</p>
      <div className="w-full">
        <section className="bg-white rounded-xl shadow p-2 w-full m-2">
          <OrganizationsTable />
        </section>
        {/* Future: Add more admin widgets/sections here */}
      </div>
    </div>
  );
} 