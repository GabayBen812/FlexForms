import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Request } from "@/types/requests/request";
import { useState } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { request } from "node:http";

const requestsApi = createApiService<Request>("/requests");

type RequestColumnMeta = { hidden?: boolean };

export default function Requests() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);

  const columns: ColumnDef<Request, any>[] = [
    {
      id: "edit",
      header: "#", 
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
        //   onClick={() => onEdit(row.original)}
          title={t("edit_request")}
        >
          <Pencil  className="w-4 h-4" />
        </Button>
      ),
      meta: { className: "text-center", editable: false },
    },
    { accessorKey: "name", header: t("request_name") },
    { accessorKey: "submittedBy", header: t("submitted_by") },
    { accessorKey: "type", header: t("request_type") },
    { accessorKey: "status", header: t("request_status") },
    

    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];
  //@ts-ignore
  const visibleColumns = columns.filter((col) => !col.meta?.hidden);

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("requests")}</h1>
      <DataTable<Request>
        data={requests}
        updateData={async () => Promise.resolve({} as any)}
        // fetchData={async (params) => {
        //   if (!organization?._id) return { status: 200, data: [] };
        //   const result = await usersApi.fetchAll(
        //     params,
        //     false,
        //     organization._id
        //   );
        //   if ("data" in result && Array.isArray(result.data))
        //     setUsers(result.data);
        //   return result;
        // }}
        columns={visibleColumns}
        searchable
        showAddButton
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        defaultPageSize={10}
        idField="_id"
        extraFilters={advancedFilters}
        onRowClick={(user) => {}}
      />
    </div>
  );
}
