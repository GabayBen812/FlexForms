import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { Plus, Settings } from "lucide-react";
import { CheckedState } from "@radix-ui/react-checkbox";

import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import {
  ApiQueryParams,
  ApiResponse,
  DataTableProps,
  TableAction,
} from "@/types/ui/data-table-types";
import { Account } from "@/types/accounts/account";
import {
  createAccount,
  deleteAccount,
  deleteManyAccounts,
  fetchAllAccounts,
  updateAccount,
} from "@/api/accounts";
import { Button } from "@/components/ui/button";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { AdvancedUpdateDialog } from "@/components/AdvancedUpdateDialog";
import { toast } from "@/hooks/use-toast";
import { showConfirm } from "@/utils/swal";

export default function AccountsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();

  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [isAdvancedUpdateOpen, setIsAdvancedUpdateOpen] = useState(false);
  const [advancedUpdateRows, setAdvancedUpdateRows] = useState<Account[]>([]);
  const [advancedUpdateCount, setAdvancedUpdateCount] = useState(0);
  const [isAdvancedUpdating, setIsAdvancedUpdating] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Account) => void;
    updateItem: (item: Account) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Account[]>([]);

  const selectionColumn: ColumnDef<Account> = {
    id: "select",
    enableSorting: false,
    header: ({ table }) => {
      const selectedCount = table.getSelectedRowModel().rows.length;
      const checkedState: CheckedState = table.getIsAllPageRowsSelected()
        ? true
        : table.getIsSomePageRowsSelected()
        ? "indeterminate"
        : false;
      return (
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            checked={checkedState}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
            setEditingAccount(row.original);
            setIsEditDialogOpen(true);
          }}
        />
      </div>
    ),
    enableHiding: false,
    size: 140,
  };

  const baseColumns = useMemo<ColumnDef<Account>[]>(() => {
    return [
      selectionColumn,
      { accessorKey: "name", header: t("account_name") },
      { accessorKey: "organizationId", header: "", meta: { hidden: true } },
    ];
  }, [selectionColumn, t]);

  const visibleColumns = useMemo(() => {
    return baseColumns.filter(
      //@ts-ignore
      (col) => !(col.meta && col.meta.hidden)
    );
  }, [baseColumns]);

  const mergedColumns = useMemo(() => {
    return mergeColumnsWithDynamicFields(
      visibleColumns,
      "accounts",
      organization,
      t
    );
  }, [visibleColumns, organization, t]);

  const actions: TableAction<Account>[] = useMemo(
    () => [
      { label: t("edit"), type: "edit" },
      { label: t("delete"), type: "delete" },
    ],
    [t]
  );

  const getFallbackSelectedRows = useCallback((): Account[] => {
    return Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Account => !!row);
  }, [rowSelection, tableRows]);

  const handleAddAccount = useCallback(
    async (data: any) => {
      try {
        const payload: Partial<Account> = {
          ...data,
          name: data.name,
          organizationId: organization?._id || "",
          ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
        };

        const res = await createAccount(payload);
        if (res.error) {
          const errorMessage =
            res.error || t("error") || "Failed to create account";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        if ((res.status === 200 || res.status === 201) && res.data) {
          toast.success(t("form_created_success"));
          setIsAddDialogOpen(false);
          tableMethods?.addItem(res.data);
        } else {
          toast.success(t("form_created_success"));
          setIsAddDialogOpen(false);
          tableMethods?.refresh();
        }
      } catch (error) {
        console.error("Error creating account:", error);
        const errorMessage =
          error instanceof Error ? error.message : t("error");
        toast.error(errorMessage || t("error"));
        throw error;
      }
    },
    [organization?._id, t, tableMethods]
  );

  const handleEditAccount = useCallback(
    async (data: any) => {
      if (!editingAccount?._id) return;
      try {
        const payload: Partial<Account> & { id: string } = {
          ...data,
          id: editingAccount._id,
          organizationId: organization?._id || "",
          ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
        };

        const res = await updateAccount(payload);
        if (res.error) {
          const errorMessage =
            res.error || t("error") || "Failed to update account";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        if ((res.status === 200 || res.status === 201) && res.data) {
          toast.success(t("updated_successfully"));
          setIsEditDialogOpen(false);
          setEditingAccount(null);
          tableMethods?.updateItem(res.data);
        } else {
          toast.success(t("updated_successfully"));
          setIsEditDialogOpen(false);
          setEditingAccount(null);
          tableMethods?.refresh();
        }
      } catch (error) {
        console.error("Error updating account:", error);
        toast.error(t("error"));
        throw error;
      }
    },
    [editingAccount, organization?._id, t, tableMethods]
  );

  const handleBulkDelete = useCallback(
    async (selectedRowsParam?: Account[]) => {
      const rowsToDelete = selectedRowsParam?.length
        ? selectedRowsParam
        : getFallbackSelectedRows();

      if (!rowsToDelete.length) {
        toast.error(t("select_rows_first", "Select rows first"));
        return;
      }

      const ids = rowsToDelete
        .map((row) => row._id)
        .filter((id): id is string => !!id);

      if (!ids.length) return;

      const confirmed = await showConfirm(
        t("confirm_delete") || t("common:confirm_delete") || "Are you sure?"
      );
      if (!confirmed) return;

      try {
        const res = await deleteManyAccounts(ids);
        if (res.error) {
          throw new Error(res.error);
        }

        toast.success(t("deleted_successfully"));
        setRowSelection({});
        tableMethods?.refresh();
      } catch (error) {
        console.error("Error deleting accounts:", error);
        toast.error(t("delete_failed") || "Failed to delete items");
      }
    },
    [getFallbackSelectedRows, t, tableMethods]
  );

  const handleBulkAdvancedUpdate = useCallback(
    (selectedRowsParam: Account[]) => {
      const rowsToUpdate = selectedRowsParam.length
        ? selectedRowsParam
        : getFallbackSelectedRows();

      if (!rowsToUpdate.length) {
        toast.error(t("select_rows_first", "Select rows first"));
        return;
      }

      setAdvancedUpdateRows(rowsToUpdate);
      setAdvancedUpdateCount(rowsToUpdate.length);
      setIsAdvancedUpdateOpen(true);
    },
    [getFallbackSelectedRows, t]
  );

  const handleAdvancedUpdateConfirm = useCallback(
    async (field: string, value: string | string[]) => {
      const rowsToUpdate = advancedUpdateRows.length
        ? advancedUpdateRows
        : getFallbackSelectedRows();

      const ids = rowsToUpdate
        .map((row) => row._id)
        .filter((id): id is string => !!id);

      if (!ids.length) {
        toast.error(t("select_rows_first", "Select rows first"));
        return;
      }

      const payload =
        field.startsWith("dynamicFields.") && typeof field === "string"
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
            updateAccount({
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
    },
    [
      advancedUpdateRows,
      getFallbackSelectedRows,
      organization?._id,
      t,
      tableMethods,
    ]
  );

  const fetchAccounts = useCallback<DataTableProps<Account>["fetchData"]>(
    async (params: ApiQueryParams = {}) => {
      if (!organization?._id) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        };
      }

      const response = await fetchAllAccounts(params, organization._id);
      const payload = response?.data;

      if (payload && Array.isArray((payload as ApiResponse<Account>).data)) {
        const castPayload = payload as ApiResponse<Account>;
        return {
          data: castPayload.data ?? [],
          totalCount: castPayload.totalCount ?? castPayload.data.length,
          totalPages: castPayload.totalPages ?? 1,
        };
      }

      if (Array.isArray(payload)) {
        return {
          data: payload,
          totalCount: payload.length,
          totalPages: 1,
        };
      }

      return {
        data: [],
        totalCount: 0,
        totalPages: 0,
      };
    },
    [organization?._id]
  );

  const handleRefreshReady = useCallback(
    (methods: {
      refresh: () => void;
      addItem: (item: Account) => void;
      updateItem: (item: Account) => void;
    }) => {
      setTableMethods(methods);
    },
    []
  );

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  const handleVisibleRows = useCallback((rows: Account[]) => {
    setTableRows(rows);
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("accounts")}
      </h1>
      <DataTable<Account>
        data={[]}
        fetchData={fetchAccounts}
        addData={createAccount}
        updateData={updateAccount}
        deleteData={deleteAccount}
        columns={mergedColumns}
        actions={actions}
        searchable
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        defaultPageSize={10}
        idField="_id"
        extraFilters={advancedFilters}
        organazitionId={organization?._id}
        entityType="accounts"
        enableColumnReordering
        onRefreshReady={handleRefreshReady}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        visibleRows={handleVisibleRows}
        customLeftButtons={
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t("add")}
            </Button>
            <Button
              onClick={() => setIsFieldConfigDialogOpen(true)}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              {t("configure_fields", "ערוך שדות דינאמיים")}
            </Button>
          </div>
        }
        onBulkDelete={handleBulkDelete}
        onBulkAdvancedUpdate={handleBulkAdvancedUpdate}
      />

      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={mergedColumns}
        onAdd={handleAddAccount}
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
            setEditingAccount(null);
          }
        }}
        columns={mergedColumns}
        onAdd={handleAddAccount}
        onEdit={handleEditAccount}
        editMode
        editData={
          editingAccount
            ? {
                name: editingAccount.name,
                ...(editingAccount.dynamicFields && {
                  dynamicFields: editingAccount.dynamicFields,
                }),
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
        entityType="accounts"
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
