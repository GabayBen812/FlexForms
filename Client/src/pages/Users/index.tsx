import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { User } from "@/types/users/user";
import { useState } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";

const usersApi = createApiService<User>("/users");

export default function Users() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const columns: ColumnDef<User>[] = [
    { accessorKey: "name", header: t("user_name") },
    { accessorKey: "email", header: t("user_email") },
    {accessorKey: "role", header: t("user_role")},
    {accessorKey: "organizationId", header: "", meta: { hidden: true }},
  ];
  const visibleColumns = columns.filter((col) => !(col.meta?.hidden));

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("users")}</h1>
      <div className="flex gap-2 mb-2">
        <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
          {t('advanced_search', 'חיפוש מתקדם')}
        </Button>
      </div>
      <AdvancedSearchModal
        open={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        columns={visibleColumns}
        onApply={setAdvancedFilters}
        initialFilters={advancedFilters}
      />
      <DataTable<User>
        fetchData={(params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return usersApi.fetchAll(params, false, organization._id);
        }}
        columns={visibleColumns}
        searchable
        showAddButton
        isPagination
        defaultPageSize={10}
        idField="_id"
        extraFilters={advancedFilters}
        onRowClick={(user) => {
          
        }}
      />
    </div>
  );
}
