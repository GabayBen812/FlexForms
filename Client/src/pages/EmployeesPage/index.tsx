import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useState } from "react";
import { Plus } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { toast } from "sonner";

export interface Employee {
  _id?: string;
  id?: string;
  firstname: string;
  lastname: string;
  address?: string;
  phone?: string;
  email: string;
  idNumber?: string;
  organizationId: string;
}

const employeesApi = createApiService<Employee>("/employees", {
  includeOrgId: true,
});

export default function EmployeesPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null);

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: "firstname", header: t("firstname") },
    { accessorKey: "lastname", header: t("lastname") },
    { accessorKey: "address", header: t("address") },
    { accessorKey: "phone", header: t("phone") },
    { accessorKey: "email", header: t("email") },
    { accessorKey: "idNumber", header: t("id") },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  const actions: TableAction<Employee>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const handleAddEmployee = async (data: any) => {
    try {
      const newEmployee = {
        ...data,
        organizationId: organization?._id || "",
      };
      const res = await employeesApi.create(newEmployee);
      if (res.status === 200 || res.data) {
        toast.success(t("form_created_success"));
        setIsAddDialogOpen(false);
        // Trigger table refresh
        refreshFn?.();
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("employees")}
      </h1>
      <DataTable<Employee>
        data={[]}
        fetchData={(params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return employeesApi.fetchAll(params, false, organization._id);
        }}
        addData={employeesApi.create}
        updateData={employeesApi.update}
        deleteData={employeesApi.delete}
        columns={visibleColumns}
        actions={actions}
        searchable
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        defaultPageSize={10}
        //@ts-ignore
        idField="_id"
        extraFilters={advancedFilters}
        organazitionId={organization?._id}
        onRefreshReady={(fn) => setRefreshFn(() => fn)}
        customLeftButtons={
          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> {t("add")}
          </Button>
        }
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={visibleColumns}
        onAdd={handleAddEmployee}
        excludeFields={["organizationId"]}
        defaultValues={{
          organizationId: organization?._id || "",
        }}
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
