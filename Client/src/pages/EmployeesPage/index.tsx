import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { z } from "zod";
import { useState, useCallback, useMemo } from "react";
import { Plus, Trash, Pencil, Settings } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { showConfirm } from "@/utils/swal";

export interface Employee {
  _id?: string;
  id?: string;
  firstname: string;
  lastname: string;
  idNumber?: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Employee) => void;
    updateItem: (item: Employee) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Employee[]>([]);

  // Custom selection column with edit icon
  const selectionColumn: ColumnDef<Employee> = {
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
            setEditingEmployee(row.original);
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

  const columns: ColumnDef<Employee>[] = [
    selectionColumn,
    { accessorKey: "firstname", header: t("firstname") },
    { accessorKey: "lastname", header: t("lastname") },
    { accessorKey: "idNumber", header: t("id") },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  // Merge static columns with dynamic fields
  const mergedColumns = useMemo(() => {
    return mergeColumnsWithDynamicFields(
      visibleColumns,
      "employees",
      organization,
      t
    );
  }, [visibleColumns, organization, t]);

  const actions: TableAction<Employee>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const handleAddEmployee = async (data: any) => {
    try {
      console.log("handleAddEmployee received data:", data);
      const newEmployee = {
        ...data,
        organizationId: organization?._id || "",
        // Preserve dynamicFields if it exists
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      console.log("newEmployee to send:", newEmployee);
      const res = await employeesApi.create(newEmployee);
      
      // Check for errors in response
      if (res.error) {
        const errorMessage = res.error || t("error") || "Failed to create employee";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check if response is successful (200 or 201)
      if ((res.status === 200 || res.status === 201) && res.data) {
        const createdEmployee = res.data;
        toast.success(t("form_created_success"));
        setIsAddDialogOpen(false);
        // Add item directly to table without refresh
        tableMethods?.addItem(createdEmployee);
      } else {
        const errorMessage = res.error || t("error") || "Failed to create employee";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message 
        || (error as any)?.error 
        || t("error") || "An error occurred";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleEditEmployee = async (data: any) => {
    if (!editingEmployee?._id) return;
    try {
      const updatedEmployee = {
        ...data,
        id: editingEmployee._id,
        organizationId: organization?._id || "",
        // Preserve dynamicFields if they exist
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      const res = await employeesApi.update(updatedEmployee);
      if (res.status === 200 || res.data) {
        const updatedEmployeeData = res.data;
        toast.success(t("updated_successfully") || "Record updated successfully");
        setIsEditDialogOpen(false);
        setEditingEmployee(null);
        // Update item directly in table without refresh
        tableMethods?.updateItem(updatedEmployeeData);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedRows = selectedIndices.map((index) => tableRows[index]).filter((row): row is Employee => !!row);
    const selectedIds = selectedRows.map((row) => row._id).filter((id): id is string => !!id);
    
    if (selectedIds.length === 0) return;
    
    const count = selectedIds.length;
    const confirmed = await showConfirm(
      t("confirm_delete", { count }) || 
      `Are you sure you want to delete ${count} item(s)?`
    );
    
    if (!confirmed) return;
    
    try {
      await Promise.all(selectedIds.map((id) => employeesApi.delete(id)));
      toast.success(t("deleted_successfully") || `Successfully deleted ${count} item(s)`);
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting employees:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("employees")}
      </h1>
      <DataTable<Employee>
        data={[]}
        fetchData={useCallback((params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return employeesApi.fetchAll(params, false, organization._id);
        }, [organization?._id])}
        addData={employeesApi.create}
        updateData={employeesApi.update}
        deleteData={employeesApi.delete}
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
        entityType="employees"
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
              variant="outline" 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" /> {t("add")}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBulkDelete}
              disabled={Object.keys(rowSelection).length === 0}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Trash className="w-4 h-4 mr-2" /> {t("delete")}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsFieldConfigDialogOpen(true)}
              className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500 hover:border-gray-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <Settings className="w-4 h-4 mr-2" /> {t("configure_fields", "ערוך שדות דינאמיים")}
            </Button>
          </div>
        }
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={mergedColumns}
        onAdd={handleAddEmployee}
        excludeFields={["organizationId"]}
        defaultValues={{
          organizationId: organization?._id || "",
        }}
      />
      <AddRecordDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingEmployee(null);
          }
        }}
        columns={mergedColumns}
        onAdd={handleAddEmployee}
        onEdit={handleEditEmployee}
        editMode={true}
        editData={editingEmployee ? {
          firstname: editingEmployee.firstname,
          lastname: editingEmployee.lastname,
          idNumber: editingEmployee.idNumber || "",
          ...(editingEmployee.dynamicFields ? { dynamicFields: editingEmployee.dynamicFields } : {}),
        } : undefined}
        excludeFields={["organizationId"]}
        defaultValues={{
          organizationId: organization?._id || "",
        }}
      />
      <TableFieldConfigDialog
        open={isFieldConfigDialogOpen}
        onOpenChange={setIsFieldConfigDialogOpen}
        entityType="employees"
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
