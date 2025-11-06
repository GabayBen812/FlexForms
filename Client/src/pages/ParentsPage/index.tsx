import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { z } from "zod";
import { useState, useCallback, useMemo } from "react";
import { Plus, Trash, Pencil, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { Parent } from "@/types/parents/parent";
import { Kid } from "@/types/kids/kid";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { SmartLoadFromExcel } from "@/components/ui/completed/dialogs/SmartLoadFromExcel";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateForEdit } from "@/lib/dateUtils";
import { showConfirm } from "@/utils/swal";

const parentsApi = createApiService<Parent>("/parents", {
  includeOrgId: true,
});

const kidsApi = createApiService<Kid>("/kids", {
  includeOrgId: true,
});

export default function ParentsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Parent) => void;
    updateItem: (item: Parent) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Parent[]>([]);

  // Fetch kids for multi-select
  const { data: kidsOptions = [], isLoading: kidsLoading } = useQuery({
    queryKey: ["kids-options", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return [];
      const res = await kidsApi.fetchAll({}, false, organization._id);
      return (res.data || []).map((kid: Kid) => ({
        value: kid._id || "",
        label: `${kid.firstname} ${kid.lastname}`,
      }));
    },
    enabled: !!organization?._id,
  });

  // Custom selection column with edit icon
  const selectionColumn: ColumnDef<Parent> = {
    id: "select",
    enableSorting: false,
    header: ({ table }) => {
      const selectedCount = table.getSelectedRowModel().rows.length;
      return (
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            // @ts-ignore
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="border-white"
          />
          <span className="text-xs text-white">
            {selectedCount} נבחרו
          </span>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setEditingParent(row.original);
            setIsEditDialogOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    ),
    enableHiding: false,
    size: 150,
  };

  const columns: ColumnDef<Parent>[] = [
    selectionColumn,
    { accessorKey: "firstname", header: t("firstname") },
    { accessorKey: "lastname", header: t("lastname") },
    { accessorKey: "idNumber", header: t("id_number") },
    { 
      accessorKey: "linked_kids", 
      header: t("linked_kids"),
      meta: {
        editable: true,
        relationshipOptions: kidsOptions,
      },
    },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  // Merge static columns with dynamic fields
  const mergedColumns = useMemo(() => {
    // Update columns with current kidsOptions
    const updatedColumns = visibleColumns.map((col) => {
      if ((col as any).accessorKey === "linked_kids") {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            relationshipOptions: kidsOptions,
          },
        };
      }
      return col;
    });
    return mergeColumnsWithDynamicFields(
      updatedColumns,
      "parents",
      organization,
      t
    );
  }, [visibleColumns, organization, t, kidsOptions]);

  const actions: TableAction<Parent>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const handleAddParent = async (data: any) => {
    try {
      console.log("handleAddParent received data:", data);
      const newParent = {
        ...data,
        organizationId: organization?._id || "",
        linked_kids: Array.isArray(data.linked_kids) ? data.linked_kids : [],
        // Preserve dynamicFields if it exists
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      console.log("newParent to send:", newParent);
      const res = await parentsApi.create(newParent);
      
      // Check for errors in response
      if (res.error) {
        const errorMessage = res.error || t("error") || "Failed to create parent";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check if response is successful (200 or 201)
      if ((res.status === 200 || res.status === 201)) {
        if (res.data) {
          // We have data - use it directly
          const createdParent = res.data;
          toast.success(t("form_created_success"));
          setIsAddDialogOpen(false);
          // Add item directly to table without refresh
          tableMethods?.addItem(createdParent);
        } else {
          // Status is OK but no data - refresh table to get the new record
          toast.success(t("form_created_success"));
          setIsAddDialogOpen(false);
          tableMethods?.refresh();
        }
      } else {
        const errorMessage = res.error || t("error") || "Failed to create parent";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating parent:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message 
        || (error as any)?.error 
        || t("error") || "An error occurred";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleEditParent = async (data: any) => {
    if (!editingParent?._id) return;
    try {
      const updatedParent = {
        ...data,
        id: editingParent._id,
        organizationId: organization?._id || "",
        linked_kids: Array.isArray(data.linked_kids) 
          ? data.linked_kids 
          : (Array.isArray(editingParent.linked_kids) 
              ? editingParent.linked_kids.map((k: any) => typeof k === 'string' ? k : (k?._id || k?.toString() || k))
              : []),
        // Preserve dynamicFields if they exist
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      const res = await parentsApi.update(updatedParent);
      if (res.status === 200 || res.data) {
        const updatedParentData = res.data;
        toast.success(t("updated_successfully") || "Record updated successfully");
        setIsEditDialogOpen(false);
        setEditingParent(null);
        // Update item directly in table without refresh
        tableMethods?.updateItem(updatedParentData);
      }
    } catch (error) {
      console.error("Error updating parent:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedRows = selectedIndices.map((index) => tableRows[index]).filter((row): row is Parent => !!row);
    const selectedIds = selectedRows.map((row) => row._id).filter((id): id is string => !!id);
    
    if (selectedIds.length === 0) return;
    
    const confirmed = await showConfirm(
      t("confirm_delete") || t("common:confirm_delete") || "Are you sure?"
    );
    
    if (!confirmed) return;
    
    try {
      await Promise.all(selectedIds.map((id) => parentsApi.delete(id)));
      toast.success(t("deleted_successfully") || "Successfully deleted item(s)");
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting parents:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("parents")}
      </h1>
      <DataTable<Parent>
        data={[]}
        fetchData={useCallback((params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return parentsApi.fetchAll(params, false, organization._id);
        }, [organization?._id])}
        addData={parentsApi.create}
        updateData={parentsApi.update}
        deleteData={parentsApi.delete}
        columns={mergedColumns}
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
        entityType="parents"
        onRefreshReady={useCallback((methods) => setTableMethods(methods), [])}
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
            <Button 
              variant="info" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> {t("add")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={Object.keys(rowSelection).length === 0}
            >
              <Trash className="w-4 h-4 mr-2" /> {t("delete")}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setIsFieldConfigDialogOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" /> {t("configure_fields", "ערוך שדות דינאמיים")}
            </Button>
            <SmartLoadFromExcel />
          </div>
        }
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={mergedColumns}
        onAdd={handleAddParent}
        excludeFields={["organizationId"]}
        relationshipFields={{
          linked_kids: {
            options: kidsOptions,
          },
        }}
        defaultValues={{
          organizationId: organization?._id || "",
          linked_kids: [],
        }}
      />
      <AddRecordDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingParent(null);
          }
        }}
        columns={mergedColumns}
        onAdd={handleAddParent}
        onEdit={handleEditParent}
        editMode={true}
        editData={editingParent ? {
          firstname: editingParent.firstname,
          lastname: editingParent.lastname,
          idNumber: editingParent.idNumber || "",
          linked_kids: Array.isArray(editingParent.linked_kids) 
            ? editingParent.linked_kids.map((k: any) => typeof k === 'string' ? k : (k?._id || k?.toString() || k))
            : [],
          ...(editingParent.dynamicFields ? { dynamicFields: editingParent.dynamicFields } : {}),
        } : undefined}
        relationshipFields={{
          linked_kids: {
            options: kidsOptions,
          },
        }}
        excludeFields={["organizationId"]}
        defaultValues={{
          organizationId: organization?._id || "",
          linked_kids: editingParent?.linked_kids || [],
        }}
      />
      <TableFieldConfigDialog
        open={isFieldConfigDialogOpen}
        onOpenChange={setIsFieldConfigDialogOpen}
        entityType="parents"
        organizationId={organization?._id || ""}
        onSave={() => {
          tableMethods?.refresh();
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
