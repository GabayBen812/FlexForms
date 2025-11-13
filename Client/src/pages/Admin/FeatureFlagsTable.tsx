import { useState, useEffect, useMemo, useCallback } from "react";
import { FeatureFlag } from "@/types/feature-flags";
import { DataTable } from "@/components/ui/completed/data-table";
import { ColumnDef, RowSelectionState, flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAllFeatureFlags,
  updateFeatureFlag,
  deleteFeatureFlag,
} from "@/api/feature-flags";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import FeatureFlagEditForm from "@/components/forms/FeatureFlagEditForm";
import FeatureFlagOrganizationsModal from "@/components/forms/FeatureFlagOrganizationsModal";
import FeatureFlagCreateForm from "@/components/forms/FeatureFlagCreateForm";
import { fetchAllOrganizations } from "@/api/organizations";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { showConfirm } from "@/utils/swal";

export default function FeatureFlagsTable() {
  const { t } = useTranslation();
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deletingFlag, setDeletingFlag] = useState<FeatureFlag | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [orgsModalFlag, setOrgsModalFlag] = useState<FeatureFlag | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<
    { _id: string; name: string; featureFlagIds: string[] }[]
  >([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<FeatureFlag[]>([]);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: FeatureFlag) => void;
    updateItem: (item: FeatureFlag) => void;
  } | null>(null);

  const handleUpdateFlag = async (
    payload: Partial<FeatureFlag> & { id: string | number }
  ) => {
    const { id, ...update } = payload;
    const response = await updateFeatureFlag(String(id), update);
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  };

  useEffect(() => {
    async function loadOrgs() {
      setOrgsLoading(true);
      const res = await fetchAllOrganizations();
      // Defensive: support both _id and id, and include featureFlagIds
      const orgs = (res.data || []).map((org: any) => ({
        _id: org._id || org.id,
        name: org.name,
        featureFlagIds: org.featureFlagIds || [],
      }));
      setAllOrganizations(orgs);
      setOrgsLoading(false);
    }
    loadOrgs();
  }, [refreshKey]);

  const selectionColumn: ColumnDef<FeatureFlag> = useMemo(
    () => ({
      id: "select",
      enableSorting: false,
      header: ({ table }) => {
        const selectedCount = table.getSelectedRowModel().rows.length;
        return (
          <div className="flex items-center justify-center gap-2">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
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
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("select_row", "Select row")}
          />
        </div>
      ),
      enableHiding: false,
      size: 120,
    }),
    [t]
  );

  const columns: ColumnDef<FeatureFlag>[] = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "key",
        header: t("key", "Key"),
        meta: {
          editable: false,
        },
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <span
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="cursor-default select-text"
            >
              {getValue<string>()}
            </span>
          </div>
        ),
      },
      { 
        accessorKey: "name", 
        header: t("name", "Name"),
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <span>{getValue<string>()}</span>
          </div>
        )
      },
      { 
        accessorKey: "description", 
        header: t("description", "Description"),
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <span>{getValue<string>()}</span>
          </div>
        )
      },
      {
        accessorKey: "isEnabled",
        header: t("enabled", "Enabled"),
        meta: {
          fieldType: "CHECKBOX",
        },
        cell: ({ getValue }) => {
          const value = getValue();
          const isChecked = value === true || value === "true" || value === "1";
          return (
            <div className="flex justify-center">
              <span>{isChecked ? "✓" : ""}</span>
            </div>
          );
        }
      },
      {
        accessorKey: "tags",
        header: t("tags", "Tags"),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-1">
              {row.original.tags?.map((tag) => (
                <span key={tag} className="bg-muted px-2 py-0.5 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: t("actions", "Actions"),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFlag(row.original);
                }}
                aria-label={t("edit", "Edit")}
                tooltip={t("edit", "Edit")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingFlag(row.original);
                }}
                aria-label={t("delete", "Delete")}
                tooltip={t("delete", "Delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ),
      },
    ],
    [selectionColumn, t]
  );

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  const handleVisibleRows = useCallback((rows: FeatureFlag[]) => {
    setTableRows(rows);
  }, []);

  const handleRefreshReady = useCallback(
    (methods: {
      refresh: () => void;
      addItem: (item: FeatureFlag) => void;
      updateItem: (item: FeatureFlag) => void;
    }) => {
      setTableMethods(methods);
    },
    []
  );

  const handleBulkDelete = useCallback(
    async (selectedRowsParam?: FeatureFlag[]) => {
      const fallbackSelectedRows = Object.keys(rowSelection)
        .map(Number)
        .map((index) => tableRows[index])
        .filter((row): row is FeatureFlag => !!row);

      const selectedRows = selectedRowsParam?.length
        ? selectedRowsParam
        : fallbackSelectedRows;

      const selectedIds = selectedRows
        .map((row) => row._id)
        .filter((id): id is string => !!id);

      if (!selectedIds.length) return;

      const confirmed = await showConfirm(
        t("confirm_delete") || t("common:confirm_delete") || "Are you sure?"
      );

      if (!confirmed) return;

      try {
        await Promise.all(selectedIds.map((id) => deleteFeatureFlag(id)));
        toast.success(t("deleted_successfully") || "Deleted successfully");
        setRowSelection({});
        if (tableMethods) {
          tableMethods.refresh();
        } else {
          setRefreshKey((k) => k + 1);
        }
      } catch (error) {
        console.error("Error deleting feature flags:", error);
        toast.error(t("delete_failed") || "Failed to delete items");
      }
    },
    [rowSelection, tableRows, t, tableMethods]
  );

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center gap-4 text-center mb-8">
        
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full max-w-md py-6 px-10 text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
        >
          {t("create_new_feature_flag", "Create new Feature Flag")}
        </Button>
      </div>
      <DataTable<FeatureFlag>
        data={[]}
        key={refreshKey}
        columns={columns}
        fetchData={fetchAllFeatureFlags}
        addData={async () => {
          return { data: {} as FeatureFlag, status: 200 };
        }}
        updateData={handleUpdateFlag}
        idField="_id"
        searchable
        isPagination={false}
        onRowClick={(row) => setOrgsModalFlag(row)}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        visibleRows={handleVisibleRows}
        onRefreshReady={handleRefreshReady}
        onBulkDelete={handleBulkDelete}
      />

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <FeatureFlagCreateForm
          onClose={() => setIsCreateDialogOpen(false)}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* Edit Dialog */}
      {editingFlag && (
        <FeatureFlagEditForm
          flag={editingFlag}
          onClose={() => setEditingFlag(null)}
          onUpdated={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* Organization Assignment Modal */}
      {orgsModalFlag && (
        <FeatureFlagOrganizationsModal
          flag={orgsModalFlag}
          organizations={allOrganizations}
          onClose={() => setOrgsModalFlag(null)}
          onUpdated={() => setRefreshKey((k) => k + 1)}
          //@ts-ignore
          isLoading={orgsLoading}
        />
      )}

      {/* Delete Dialog */}
      {deletingFlag && (
        <Dialog
          open={!!deletingFlag}
          onOpenChange={() => setDeletingFlag(null)}
        >
          <DialogContent>
            <DialogTitle>
              {t("delete_feature_flag", "Delete Feature Flag")}
            </DialogTitle>
            <p>
              {t(
                "delete_confirm",
                "Are you sure you want to delete this feature flag?"
              )}
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteFeatureFlag(deletingFlag._id);
                  setDeletingFlag(null);
                  setRefreshKey((k) => k + 1);
                }}
                className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                {t("delete", "Delete")}
              </Button>
              <Button variant="outline" onClick={() => setDeletingFlag(null)} className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium">
                {t("cancel", "Cancel")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
