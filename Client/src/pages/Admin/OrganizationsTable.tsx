import { Organization } from '@/types/api/organization';
import { fetchOrganization, fetchAllOrganizations } from '@/api/organizations';
import { DataTable } from '@/components/ui/completed/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ApiQueryParams, ApiResponse } from '@/types/ui/data-table-types';
import { MutationResponse } from '@/types/api/auth';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { AdvancedSearchModal } from '@/components/ui/completed/data-table/AdvancedSearchModal';
import { Button } from '@/components/ui/button';

const noop = async () => Promise.reject(new Error('Not implemented'));

export default function OrganizationsTable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const columns: ColumnDef<Organization>[] = [
    { accessorKey: 'name', header: t('organization_name') },
    { accessorKey: 'description', header: t('organization_description') },
    { accessorKey: 'owner', header: t('organization_owner') },
  ];


  async function fetchData(params: ApiQueryParams): Promise<ApiResponse<Organization> | MutationResponse<Organization[]>> {
    const mergedParams = { ...params, ...advancedFilters };
    if (user?.role === 'system_admin') {
      const res = await fetchAllOrganizations(mergedParams);
      const orgs: Organization[] = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
      return {
        data: orgs,
        totalCount: orgs.length,
        totalPages: 1,
      };
    } else {
      const res = await fetchOrganization(mergedParams.search);
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
      <div className="flex gap-2 mb-2">
        <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
          {t('advanced_search', 'חיפוש מתקדם')}
        </Button>
      </div>
      <AdvancedSearchModal
        open={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        columns={columns}
        onApply={setAdvancedFilters}
        initialFilters={advancedFilters}
      />
      <DataTable<Organization>
        data={[]}
        columns={columns}
        fetchData={fetchData}
        addData={noop}
        updateData={noop}
        searchable
        isPagination={false}
        extraFilters={advancedFilters}
      />
    </div>
  );
} 