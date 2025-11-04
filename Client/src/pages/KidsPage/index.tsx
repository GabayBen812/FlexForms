import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useState } from "react";

import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { Kid } from "@/types/kids/kid";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";

const kidsApi = createApiService<Kid>("/kids", {
  includeOrgId: true,
});

export default function KidsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );

  const columns: ColumnDef<Kid>[] = [
    { accessorKey: "firstname", header: t("firstname") },
    { accessorKey: "lastname", header: t("lastname") },
    { accessorKey: "birthdate", header: t("birthdate") },
    { accessorKey: "sex", header: t("sex") },
    { accessorKey: "address", header: t("address") || "Address" },
    { accessorKey: "linked_parents", header: t("linked_parents") },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  const actions: TableAction<Kid>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("kids")}
      </h1>
      <DataTable<Kid>
        fetchData={(params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return kidsApi.fetchAll(params, false, organization._id);
        }}
        addData={kidsApi.create}
        updateData={kidsApi.update}
        deleteData={kidsApi.delete}
        columns={visibleColumns}
        actions={actions}
        searchable
        showAddButton={[
          { name: "organizationId", defaultValue: organization?._id || "" },
          { name: "linked_parents", defaultValue: "" }
        ]}
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        defaultPageSize={10}
        //@ts-ignore
        idField="_id"
        extraFilters={advancedFilters}
        organazitionId={organization?._id}
      />
    </div>
  );
}

export async function fetchAllFeatureFlags(params: ApiQueryParams) {
  const res = await apiClient.get("/feature-flags", { params });
  if (Array.isArray(res.data)) {
    return {
      data: res.data,
      totalCount: res.data.length,
      totalPages: 1,
    };
  }
  return res.data;
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<FeatureFlag>
) {
  const res = await apiClient.put(`/feature-flags/${id}`, data);
  return res.data;
}

export async function deleteFeatureFlag(id: string) {
  const res = await apiClient.delete(`/feature-flags/${id}`);
  return res.data;
}
