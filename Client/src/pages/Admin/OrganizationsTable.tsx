import { Organization } from '@/types/api/organization';
import { fetchOrganization, fetchAllOrganizations } from '@/api/organizations';
import { DataTable } from '@/components/ui/completed/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ApiQueryParams, ApiResponse } from '@/types/ui/data-table-types';
import { MutationResponse } from '@/types/api/auth';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

const noop = async () => Promise.reject(new Error('Not implemented'));

export default function OrganizationsTable() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const columns: ColumnDef<Organization>[] = [
    { accessorKey: 'name', header: t('organization_name') },
    { accessorKey: 'description', header: t('organization_description') },
    { accessorKey: 'owner', header: t('organization_owner') },
  ];

  async function fetchData(params: ApiQueryParams): Promise<ApiResponse<Organization> | MutationResponse<Organization[]>> {
    if (user?.role === 'system_admin') {
      const res = await fetchAllOrganizations();
      const orgs: Organization[] = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
      return {
        data: orgs,
        totalCount: orgs.length,
        totalPages: 1,
      };
    } else {
      const res = await fetchOrganization();
      const orgs: Organization[] = Array.isArray(res.data) ? res.data.filter(Boolean) : res.data ? [res.data] : [];
      return {
        data: orgs,
        totalCount: orgs.length,
        totalPages: 1,
      };
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">{t('organizations')}</h2>
      <DataTable<Organization>
        columns={columns}
        fetchData={fetchData}
        addData={noop}
        updateData={noop}
        searchable
        isPagination={false}
      />
    </div>
  );
} 