import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Club } from "@/types/clubs/club";

const usersApi = createApiService<Club>("/clubs");

export default function clubs() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  const columns: ColumnDef<Club>[] = [
    { accessorKey: "name", header: t("club_name") },
    { accessorKey: "email", header: t("club_email") },
    { accessorKey: "phone", header: t("club_phone") },
    {accessorKey: "organizationId", header: "", meta: { hidden: true },},
  ];
  const visibleColumns = columns.filter(
    (col) => !(col.meta?.hidden)
  );

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("clubs")}</h1>
      <DataTable<Club>
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
