import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { z } from "zod";
import { useState, useCallback } from "react";
import { Plus, Trash } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { Kid } from "@/types/kids/kid";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { toast } from "sonner";
import { getSelectionColumn } from "@/components/tables/selectionColumns";

const kidsApi = createApiService<Kid>("/kids", {
  includeOrgId: true,
});

export default function KidsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Kid[]>([]);

  const selectionColumn = getSelectionColumn<Kid>();
  

  const columns: ColumnDef<Kid>[] = [
    selectionColumn,
    { accessorKey: "firstname", header: t("firstname") },
    { accessorKey: "lastname", header: t("lastname") },
    { accessorKey: "birthdate", header: t("birthdate") },
    { accessorKey: "sex", header: t("sex") },
    { accessorKey: "address", header: t("address") },
    { accessorKey: "linked_parents", header: t("linked_parents") },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
    // Place selectionColumn as the last item so it renders at the right side of the table.
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  const actions: TableAction<Kid>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const handleAddKid = async (data: any) => {
    try {
      const newKid = {
        ...data,
        organizationId: organization?._id || "",
        linked_parents: data.linked_parents || [],
      };
      const res = await kidsApi.create(newKid);
      if (res.status === 200 || res.data) {
        toast.success(t("form_created_success"));
        setIsAddDialogOpen(false);
        // Trigger table refresh
        refreshFn?.();
      }
    } catch (error) {
      console.error("Error creating kid:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedRows = selectedIndices.map((index) => tableRows[index]).filter((row): row is Kid => !!row);
    const selectedIds = selectedRows.map((row) => row._id).filter((id): id is string => !!id);
    
    if (selectedIds.length === 0) return;
    
    const count = selectedIds.length;
    const confirmed = window.confirm(
      t("confirm_delete", { count }) || 
      `Are you sure you want to delete ${count} item(s)?`
    );
    
    if (!confirmed) return;
    
    try {
      await Promise.all(selectedIds.map((id) => kidsApi.delete(id)));
      toast.success(t("deleted_successfully") || `Successfully deleted ${count} item(s)`);
      setRowSelection({});
      refreshFn?.();
    } catch (error) {
      console.error("Error deleting kids:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("kids")}
      </h1>
      <DataTable<Kid>
        data={[]}
        fetchData={useCallback((params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return kidsApi.fetchAll(params, false, organization._id);
        }, [organization?._id])}
        addData={kidsApi.create}
        updateData={kidsApi.update}
        deleteData={kidsApi.delete}
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
        onRefreshReady={useCallback((fn) => setRefreshFn(() => fn), [])}
        rowSelection={rowSelection}
        onRowSelectionChange={useCallback((updater: any) => {
          setRowSelection((prev) => {
            if (typeof updater === 'function') {
              return updater(prev);
            } else {
              return updater;
            }
          });
        }, [])}
        visibleRows={useCallback((rows) => setTableRows(rows), [])}
        customLeftButtons={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> {t("add")}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBulkDelete}
              disabled={Object.keys(rowSelection).length === 0}
            >
              <Trash className="w-4 h-4 mr-2" /> {t("delete")}
            </Button>
          </div>
        }
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={visibleColumns}
        onAdd={handleAddKid}
        excludeFields={["linked_parents", "organizationId"]}
        defaultValues={{
          organizationId: organization?._id || "",
          linked_parents: [],
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
