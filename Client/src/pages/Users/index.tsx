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

type UserColumnMeta = { hidden?: boolean };

export default function Users() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const columns: ColumnDef<User, any>[] = [
    { accessorKey: "name", header: t("user_name") },
    { accessorKey: "email", header: t("user_email") },
    { accessorKey: "role", header: t("user_role") },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];
  //@ts-ignore
  const visibleColumns = columns.filter((col) => !col.meta?.hidden);

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("users")}</h1>
      <DataTable<User>
        data={users}
        updateData={async () => Promise.resolve({} as any)}
        fetchData={async (params) => {
          if (!organization?._id) return { status: 200, data: [] };
          const result = await usersApi.fetchAll(
            params,
            false,
            organization._id
          );
          if ("data" in result && Array.isArray(result.data))
            setUsers(result.data);
          return result;
        }}
        columns={visibleColumns}
        searchable
        showAddButton
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination
        defaultPageSize={10}
        idField="_id"
        extraFilters={advancedFilters}
        onRowClick={(user) => {}}
      />
    </div>
  );
}
