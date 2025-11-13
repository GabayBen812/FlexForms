import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useState, useCallback, useMemo } from "react";
import { Plus, Settings, Users, Calendar } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { AdvancedUpdateDialog } from "@/components/AdvancedUpdateDialog";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { showConfirm } from "@/utils/swal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GetDirection } from "@/lib/i18n";
import EmployeesAttendance from "./EmployeesAttendance";

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
  const [activeTab, setActiveTab] = useState("list");
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [isAdvancedUpdateOpen, setIsAdvancedUpdateOpen] = useState(false);
  const [advancedUpdateCount, setAdvancedUpdateCount] = useState(0);
  const [advancedUpdateRows, setAdvancedUpdateRows] = useState<Employee[]>([]);
  const [isAdvancedUpdating, setIsAdvancedUpdating] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Employee) => void;
    updateItem: (item: Employee) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Employee[]>([]);

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
        <TableEditButton
          onClick={(e) => {
            e.stopPropagation();
            setEditingEmployee(row.original);
            setIsEditDialogOpen(true);
          }}
        />
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
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      console.log("newEmployee to send:", newEmployee);
      const res = await employeesApi.create(newEmployee);

      if (res.error) {
        const errorMessage = res.error || t("error") || "Failed to create employee";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if ((res.status === 200 || res.status === 201) && res.data) {
        const createdEmployee = res.data;
        toast.success(t("form_created_success"));
        setIsAddDialogOpen(false);
        tableMethods?.addItem(createdEmployee);
      } else {
        const errorMessage = res.error || t("error") || "Failed to create employee";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message ||
            (error as any)?.error ||
            t("error") ||
            "An error occurred";
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
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      const res = await employeesApi.update(updatedEmployee);
      if (res.status === 200 || res.data) {
        const updatedEmployeeData = res.data;
        toast.success(
          t("updated_successfully") || "Record updated successfully"
        );
        setIsEditDialogOpen(false);
        setEditingEmployee(null);
        tableMethods?.updateItem(updatedEmployeeData);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async (selectedRowsParam?: Employee[]) => {
    const fallbackSelectedRows = Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Employee => !!row);

    const selectedRows = selectedRowsParam?.length
      ? selectedRowsParam
      : fallbackSelectedRows;

    const selectedIds = selectedRows
      .map((row) => row._id)
      .filter((id): id is string => !!id);

    if (selectedIds.length === 0) return;

    const confirmed = await showConfirm(
      t("confirm_delete") || t("common:confirm_delete") || "Are you sure?"
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => employeesApi.delete(id)));
      toast.success(t("deleted_successfully") || "Successfully deleted item(s)");
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting employees:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  const getFallbackSelectedRows = useCallback((): Employee[] => {
    return Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Employee => !!row);
  }, [rowSelection, tableRows]);

  const handleBulkAdvancedUpdate = (selectedRowsParam: Employee[]) => {
    const rowsToUpdate = selectedRowsParam.length
      ? selectedRowsParam
      : getFallbackSelectedRows();

    if (!rowsToUpdate.length) {
      toast.error(t("select_rows_first", "בחר רשומות לעדכון"));
      return;
    }

    setAdvancedUpdateRows(rowsToUpdate);
    setAdvancedUpdateCount(rowsToUpdate.length);
    setIsAdvancedUpdateOpen(true);
  };

  const handleAdvancedUpdateConfirm = async (
    field: string,
    value: string | string[]
  ) => {
    const rowsToUpdate = advancedUpdateRows.length
      ? advancedUpdateRows
      : getFallbackSelectedRows();

    const ids = rowsToUpdate
      .map((row) => row._id)
      .filter((id): id is string => !!id);

    if (!ids.length) {
      toast.error(t("select_rows_first", "בחר רשומות לעדכון"));
      return;
    }

    const payload: Record<string, any> = field.startsWith("dynamicFields.")
      ? {
          dynamicFields: {
            [field.replace("dynamicFields.", "")]: value,
          },
        }
      : { [field]: value };

    try {
      setIsAdvancedUpdating(true);

      await Promise.all(
        ids.map((id) =>
          employeesApi.update({
            id,
            organizationId: organization?._id || "",
            ...payload,
          })
        )
      );

      toast.success(t("updated_successfully"));
      tableMethods?.refresh();
      setRowSelection({});
      setAdvancedUpdateRows([]);
    } catch (error) {
      console.error("Advanced update failed", error);
      toast.error(t("error"));
      throw error;
    } finally {
      setIsAdvancedUpdating(false);
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("employees")}
      </h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
        dir={GetDirection() ? "rtl" : "ltr"}
      >
        <div className="flex justify-center mb-8">
          <TabsList className="bg-muted rounded-lg p-1 shadow border w-fit">
          <TabsTrigger
            value="list"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
              {t("employees")}
              <Users className="w-5 h-5" />
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
              {t("attendance")}
              <Calendar className="w-5 h-5" />
            </div>
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="list">
          <DataTable<Employee>
            data={[]}
            fetchData={useCallback(
              (params) => {
                if (!organization?._id)
                  return Promise.resolve({ status: 200, data: [] });
                return employeesApi.fetchAll(params, false, organization._id);
              },
              [organization?._id]
            )}
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
                if (typeof updater === "function") {
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
                  className="bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" /> {t("add")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFieldConfigDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />{" "}
                  {t("configure_fields", "ערוך שדות דינאמיים")}
                </Button>
              </div>
            }
            onBulkDelete={handleBulkDelete}
            onBulkAdvancedUpdate={handleBulkAdvancedUpdate}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <EmployeesAttendance />
        </TabsContent>
      </Tabs>

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
        editData={
          editingEmployee
            ? {
                firstname: editingEmployee.firstname,
                lastname: editingEmployee.lastname,
                idNumber: editingEmployee.idNumber || "",
                ...(editingEmployee.dynamicFields
                  ? { dynamicFields: editingEmployee.dynamicFields }
                  : {}),
              }
            : undefined
        }
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
      <AdvancedUpdateDialog
        open={isAdvancedUpdateOpen}
        onOpenChange={(open) => {
          if (!open && isAdvancedUpdating) {
            return;
          }
          setIsAdvancedUpdateOpen(open);
          if (!open) {
            setAdvancedUpdateCount(0);
            setAdvancedUpdateRows([]);
          }
        }}
        columns={mergedColumns}
        selectedRowCount={advancedUpdateCount}
        onUpdate={handleAdvancedUpdateConfirm}
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
