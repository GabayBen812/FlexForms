import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useState, useCallback, useMemo } from "react";
import { Plus, Settings } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { SmartLoadFromExcel } from "@/components/ui/completed/dialogs/SmartLoadFromExcel";
import { DataTablePageLayout } from "@/components/layout/DataTablePageLayout";
import {
  getDynamicFieldDefinitions,
  mergeColumnsWithDynamicFields,
} from "@/utils/tableFieldUtils";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { showConfirm } from "@/utils/swal";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export interface Team {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
}

const teamsApi = createApiService<Team>("/teams", {
  includeOrgId: true,
});

export default function TeamsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const { isEnabled: hasAccess, isLoading: isFeatureFlagLoading } = useFeatureFlag("IS_SHOW_TEAMS");
  
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Team) => void;
    updateItem: (item: Team) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Team[]>([]);

  const selectionColumn: ColumnDef<Team> = useMemo(() => ({
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
            setEditingTeam(row.original);
            setIsEditDialogOpen(true);
          }}
        />
      </div>
    ),
    enableHiding: false,
    size: 150,
  }), []);

  const columns: ColumnDef<Team>[] = useMemo(() => [
    selectionColumn,
    { accessorKey: "name", header: t("name", "שם"), meta: { editable: true } },
    { 
      accessorKey: "description", 
      header: t("description", "תיאור"), 
      meta: { editable: true } 
    },
    { accessorKey: "organizationId", header: "", meta: { hidden: true, editable: false } },
  ], []);

  const visibleColumns = useMemo(() => columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  ), [columns]);

  const mergedColumns = useMemo(() => {
    return mergeColumnsWithDynamicFields(
      visibleColumns,
      "teams",
      organization,
      t
    );
  }, [visibleColumns, organization, t]);

  const excelColumns = useMemo(() => mergedColumns, [mergedColumns]);

  const actions: TableAction<Team>[] = useMemo(() => [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ], [t]);

  const fetchTeamsData = useCallback(
    async (params?: ApiQueryParams) => {
      if (!organization?._id) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        } as ApiResponse<Team>;
      }
      return teamsApi.fetchAll(params, false, organization._id);
    },
    [organization?._id],
  );

  const handleAddTeam = async (data: any) => {
    try {
      const newTeam = {
        ...data,
        organizationId: organization?._id || "",
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      const res = await teamsApi.create(newTeam);
      if (res.error) {
        const errorMessage = res.error || t("error") || "Failed to create team";
        throw new Error(errorMessage);
      }
      toast.success(t("form_created_success") || "Team created successfully");
      if (isAddDialogOpen) {
        setIsAddDialogOpen(false);
      }
      if (res.data) {
        tableMethods?.addItem(res.data);
      } else {
        tableMethods?.refresh();
      }
    } catch (error) {
      console.error("Error creating team:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message ||
            (error as any)?.response?.data?.error ||
            (error as any)?.error ||
            t("error") ||
            "An error occurred";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleEditTeam = async (data: any) => {
    if (!editingTeam?._id) return;
    try {
      const updatedTeam = {
        ...data,
        id: editingTeam._id,
        organizationId: organization?._id || "",
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      const res = await teamsApi.update(updatedTeam);
      if (res.status === 200 || res.data) {
        const updatedTeamData = res.data;
        toast.success(t("updated_successfully") || "Record updated successfully");
        setIsEditDialogOpen(false);
        setEditingTeam(null);
        tableMethods?.updateItem(updatedTeamData);
      }
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async (selectedRowsParam?: Team[]) => {
    const fallbackSelectedRows = Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Team => !!row);

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
      await Promise.all(selectedIds.map((id) => teamsApi.delete(id)));
      toast.success(t("deleted_successfully") || "Successfully deleted item(s)");
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting teams:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  if (isFeatureFlagLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <DataTablePageLayout title={t("teams", "צוותים")}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("access_denied", "אין גישה לדף זה")}</p>
        </div>
      </DataTablePageLayout>
    );
  }

  return (
    <DataTablePageLayout title={t("teams", "צוותים")}>
      <>
        <DataTable<Team>
          data={[]}
          fetchData={fetchTeamsData}
          addData={teamsApi.create}
          updateData={teamsApi.update}
          deleteData={teamsApi.delete}
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
          entityType="teams"
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
                className="flex items-center gap-2 rounded-full border-transparent bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/40 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:from-emerald-500 hover:via-green-500 hover:to-teal-400 hover:text-white hover:shadow-xl hover:shadow-emerald-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
              >
                <Plus className="w-4 h-4 mr-2" /> {t("add")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFieldConfigDialogOpen(true)}
                className="flex items-center gap-2 rounded-full border-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200/40 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-400 hover:text-white hover:shadow-xl hover:shadow-purple-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200 focus-visible:ring-offset-2"
              >
                <Settings className="w-4 h-4 mr-2" /> {t("configure_fields", "ערוך שדות דינאמיים")}
              </Button>
              <SmartLoadFromExcel 
                columns={excelColumns} 
                onSaveRows={async (rows) => {
                  let successCount = 0;
                  const errorMessages: string[] = [];
                  for (let index = 0; index < rows.length; index++) {
                    try {
                      await handleAddTeam(rows[index]);
                      successCount++;
                    } catch (error) {
                      const errorMessage =
                        error instanceof Error
                          ? error.message
                          : t("error") || (typeof error === "string" ? error : "An error occurred");
                      errorMessages.push(`${index + 1}: ${errorMessage}`);
                    }
                  }
                  if (successCount) {
                    toast.success(
                      t("excel_import_success", {
                        count: successCount,
                        defaultValue: `ייבוא ${successCount} רשומות הושלם בהצלחה`,
                      }),
                    );
                    tableMethods?.refresh();
                  }
                  if (errorMessages.length) {
                    toast.error(
                      t("excel_import_partial_failure", {
                        defaultValue: `חלק מהרשומות נכשלו (${errorMessages.length}): ${errorMessages
                          .slice(0, 3)
                          .join("; ")}`,
                      }),
                    );
                  }
                }}
              />
            </div>
          }
          onBulkDelete={handleBulkDelete}
        />
        <AddRecordDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          columns={mergedColumns}
          onAdd={handleAddTeam}
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
              setEditingTeam(null);
            }
          }}
          columns={mergedColumns}
          onAdd={handleAddTeam}
          onEdit={handleEditTeam}
          editMode={true}
          editData={editingTeam ? {
            name: editingTeam.name,
            description: editingTeam.description || "",
            ...(editingTeam.dynamicFields ? { dynamicFields: editingTeam.dynamicFields } : {}),
          } : undefined}
          excludeFields={["organizationId"]}
          defaultValues={{
            organizationId: organization?._id || "",
          }}
        />
        <TableFieldConfigDialog
          open={isFieldConfigDialogOpen}
          onOpenChange={setIsFieldConfigDialogOpen}
          entityType="teams"
          organizationId={organization?._id || ""}
          onSave={() => {
            tableMethods?.refresh();
          }}
        />
      </>
    </DataTablePageLayout>
  );
}

