import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { User } from "@/types/users/user";

const usersApi = createApiService<User>("/users");

export default function Users() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  const columns: ColumnDef<User>[] = [
    { accessorKey: "name", header: t("user_name") },
    { accessorKey: "email", header: t("user_email") },
    {accessorKey: "role", header: t("user_role"),},
    {accessorKey: "organizationId", header: "", meta: { hidden: true },},
  ];
  const visibleColumns = columns.filter(
    (col) => !(col.meta?.hidden)
  );

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("users")}</h1>
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
        onRowClick={(user) => {
          
        }}
      />
    </div>
  );
}
