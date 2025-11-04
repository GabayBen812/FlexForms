import { Organization } from "@/types/api/organization";
import { fetchOrganization, fetchAllOrganizations } from "@/api/organizations";
import { DataTable } from "@/components/ui/completed/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { MutationResponse } from "@/types/api/auth";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";

const noop = async () => Promise.reject(new Error("Not implemented"));

export default function OrganizationsTable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const columns: ColumnDef<Organization>[] = [
    { accessorKey: "name", header: t("organization_name") },
    { accessorKey: "description", header: t("organization_description") },
    {
      accessorKey: "owner",
      header: t("organization_owner"),
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (typeof owner === "object" && owner !== null) {
          return (owner as any).name || (owner as any).email || String(owner);
        }
        return owner ? String(owner) : "";
      },
    },
  ];

  const fetchData = useCallback(
    async (
      params: ApiQueryParams
    ): Promise<ApiResponse<Organization> | MutationResponse<Organization[]>> => {
      const mergedParams = { ...params, ...advancedFilters };
      if (user?.role === "system_admin") {
        const res = await fetchAllOrganizations(mergedParams);
        const orgs: Organization[] = Array.isArray(res.data)
          ? res.data.filter(Boolean)
          : [];
        return {
          data: orgs,
          totalCount: orgs.length,
          totalPages: 1,
        };
      } else {
        const res = await fetchOrganization(mergedParams.search);
        const orgs: Organization[] = Array.isArray(res.data)
          ? res.data.filter(Boolean)
          : res.data
          ? [res.data]
          : [];
        return {
          data: orgs,
          totalCount: orgs.length,
          totalPages: 1,
        };
      }
    },
    [user?.role, advancedFilters]
  );

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("organizations")}
      </h1>
      <DataTable<Organization>
        data={[]}
        columns={columns}
        fetchData={fetchData}
        addData={noop}
        updateData={noop}
        searchable
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
      />
    </div>
  );
}
