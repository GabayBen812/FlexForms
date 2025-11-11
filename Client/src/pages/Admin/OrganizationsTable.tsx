import { Organization } from "@/types/api/organization";
import {
  fetchOrganization,
  fetchAllOrganizations,
  assignFeatureFlagsToOrganization,
  removeFeatureFlagFromOrganization,
} from "@/api/organizations";
import { DataTable } from "@/components/ui/completed/data-table";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { ApiQueryParams, ApiResponse, TableAction } from "@/types/ui/data-table-types";
import { MutationResponse } from "@/types/api/auth";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { createApiService } from "@/api/utils/apiFactory";
import { toast } from "@/hooks/use-toast";
import { showConfirm } from "@/utils/swal";
import OrganizationEditDialog from "./OrganizationEditDialog";

const noopReject = async () => Promise.reject(new Error("Not implemented"));
const organizationsApi = createApiService<Organization>("/organizations");

export default function OrganizationsTable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Organization[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Organization) => void;
    updateItem: (item: Organization) => void;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);

  const selectionColumn: ColumnDef<Organization> = useMemo(
    () => ({
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
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label={t("select_all", "Select all")}
              className="border-white"
            />
            <span className="text-xs text-white">
              {selectedCount} {t("selected", "selected")}
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
            aria-label={t("select_row", "Select row")}
          />
          <TableEditButton
            onClick={(e) => {
              e.stopPropagation();
              setEditingOrganization(row.original);
              setIsEditDialogOpen(true);
            }}
          />
        </div>
      ),
      enableHiding: false,
      size: 150,
    }),
    [t]
  );

  const columns: ColumnDef<Organization>[] = useMemo(
    () => [
      selectionColumn,
      { accessorKey: "name", header: t("organization_name") },
      { accessorKey: "description", header: t("organization_description") },
    ],
    [selectionColumn, t]
  );

  const actions: TableAction<Organization>[] = useMemo(
    () => [
      { label: t("edit"), type: "edit" },
      { label: t("delete"), type: "delete" },
    ],
    [t]
  );

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
        setOrganizations(orgs);
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
        setOrganizations(orgs);
        return {
          data: orgs,
          totalCount: orgs.length,
          totalPages: 1,
        };
      }
    },
    [user?.role, advancedFilters]
  );

  const handleBulkDelete = useCallback(
    async (selectedRowsParam?: Organization[]) => {
      const fallbackSelectedRows = Object.keys(rowSelection)
        .map(Number)
        .map((index) => tableRows[index])
        .filter((row): row is Organization => !!row);

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
        await Promise.all(selectedIds.map((id) => organizationsApi.delete(id)));
        toast.success(t("deleted_successfully") || "Deleted successfully");
        setRowSelection({});
        tableMethods?.refresh();
      } catch (error) {
        console.error("Error deleting organizations:", error);
        toast.error(t("delete_failed") || "Failed to delete items");
      }
    },
    [rowSelection, tableRows, t, tableMethods]
  );

  const handleEditOrganization = useCallback(
    async (data: {
      name: string;
      description?: string;
      featureFlagIds: string[];
    }) => {
      if (!editingOrganization?._id) return;

      const orgId = editingOrganization._id;
      const currentFlags = editingOrganization.featureFlagIds ?? [];
      const updatedFlags = data.featureFlagIds ?? [];

      const flagsToAdd = updatedFlags.filter(
        (flagId) => !currentFlags.includes(flagId)
      );
      const flagsToRemove = currentFlags.filter(
        (flagId) => !updatedFlags.includes(flagId)
      );

      try {
        const payload: {
          id: string;
          name?: string;
          description?: string;
        } = { id: orgId };

        if (data.name !== editingOrganization.name) {
          payload.name = data.name;
        }

        if ((data.description ?? "") !== (editingOrganization.description ?? "")) {
          payload.description = data.description;
        }

        const requests: Promise<unknown>[] = [];

        if (payload.name !== undefined || payload.description !== undefined) {
          requests.push(organizationsApi.update(payload));
        }

        if (flagsToAdd.length > 0) {
          requests.push(assignFeatureFlagsToOrganization(orgId, flagsToAdd));
        }

        if (flagsToRemove.length > 0) {
          requests.push(
            ...flagsToRemove.map((flagId) =>
              removeFeatureFlagFromOrganization(orgId, flagId)
            )
          );
        }

        if (requests.length > 0) {
          await Promise.all(requests);
        }

        const updatedOrganization = {
          ...editingOrganization,
          name: data.name,
          description: data.description,
          featureFlagIds: updatedFlags,
        };

        setOrganizations((prev) =>
          prev.map((org) => (org._id === orgId ? updatedOrganization : org))
        );
        tableMethods?.updateItem(updatedOrganization);

        toast.success(t("updated_successfully") || "Record updated successfully");
        setIsEditDialogOpen(false);
        setEditingOrganization(null);
      } catch (error) {
        console.error("Error updating organization:", error);
        toast.error(t("error"));
        throw error;
      }
    },
    [editingOrganization, t, tableMethods, setOrganizations]
  );

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  const handleVisibleRows = useCallback((rows: Organization[]) => {
    setTableRows(rows);
  }, []);

  const handleRefreshReady = useCallback(
    (methods: {
      refresh: () => void;
      addItem: (item: Organization) => void;
      updateItem: (item: Organization) => void;
    }) => {
      setTableMethods(methods);
    },
    []
  );

  const handleDialogClose = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingOrganization(null);
  }, []);

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("organizations")}
      </h1>
      <DataTable<Organization>
        data={organizations}
        columns={columns}
        fetchData={fetchData}
        addData={noopReject}
        updateData={organizationsApi.update}
        deleteData={organizationsApi.delete}
        searchable
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        actions={actions}
        idField="_id"
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        visibleRows={handleVisibleRows}
        onBulkDelete={handleBulkDelete}
        onRefreshReady={handleRefreshReady}
      />
      <OrganizationEditDialog
        open={isEditDialogOpen}
        organization={editingOrganization}
        onClose={handleDialogClose}
        onSave={handleEditOrganization}
      />
    </div>
  );
}
