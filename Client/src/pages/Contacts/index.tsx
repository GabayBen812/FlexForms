import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Contact } from "@/types/contacts/contact";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { SmartLoadFromExcel } from "@/components/ui/completed/dialogs/SmartLoadFromExcel";
import { AdvancedUpdateDialog } from "@/components/AdvancedUpdateDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";

const usersApi = createApiService<Contact>("/contacts");

export default function ContactsPage() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Contact[]>([]);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem?: (item: Contact) => void;
    updateItem?: (item: Contact) => void;
  } | null>(null);
  const [advancedUpdateRows, setAdvancedUpdateRows] = useState<Contact[]>([]);
  const [isAdvancedUpdateOpen, setIsAdvancedUpdateOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);

  const selectionColumn = useMemo<ColumnDef<Contact>>(
    () => ({
      id: "select",
      enableSorting: false,
      enableHiding: false,
      size: 60,
      meta: { excludeFromSearch: true },
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
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(event) => event.stopPropagation()}
            aria-label={t("select_row", "Select row")}
          />
        </div>
      ),
    }),
    [t]
  );

  const baseColumns: ColumnDef<Contact>[] = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "firstname",
        header: t("firstname"),
        meta: { required: true },
      },
      {
        accessorKey: "lastname",
        header: t("lastname"),
        meta: { required: true },
      },
      {
        accessorKey: "email",
        header: t("email"),
        meta: { required: false },
      },
      {
        accessorKey: "phone",
        header: t("phone"),
        meta: { required: false },
      },
    ],
    [selectionColumn, t]
  );

  const mergedColumns = useMemo(
    () =>
      mergeColumnsWithDynamicFields(
        baseColumns,
        "contacts",
        organization,
        (key) => t(key)
      ),
    [baseColumns, organization, t]
  );

  const visibleColumns = useMemo(
    () =>
      mergedColumns.filter(
        //@ts-ignore
        (col) => !col.meta?.hidden
      ),
    [mergedColumns]
  );

  const handleCreateContact = async (data: Partial<Contact>) => {
    if (!organization?._id) {
      return Promise.reject(new Error("Organization is missing"));
    }

    const { firstname, lastname, email, phone, ...rest } = data;

    const dynamicFieldEntries = Object.entries(rest).filter(([key]) =>
      key.startsWith("dynamicFields.")
    );

    const dynamicFields =
      dynamicFieldEntries.length > 0
        ? dynamicFieldEntries.reduce<Record<string, unknown>>((acc, [key, value]) => {
            const fieldKey = key.replace("dynamicFields.", "");
            acc[fieldKey] = value;
            return acc;
          }, {})
        : undefined;

    const cleanedRest = Object.fromEntries(
      Object.entries(rest).filter(([key]) => !key.startsWith("dynamicFields."))
    );

    const normalizedEmail = email?.toString().trim();
    const normalizedPhone = phone?.toString().trim();

    return usersApi.create({
      ...cleanedRest,
      firstname: firstname?.toString().trim() ?? "",
      lastname: lastname?.toString().trim() ?? "",
      email: normalizedEmail ? normalizedEmail : undefined,
      phone: normalizedPhone ? normalizedPhone : undefined,
      organizationId: organization._id,
      type: "contact",
      status: "active",
      ...(dynamicFields ? { dynamicFields } : {}),
    });
  };

  const getFallbackSelectedRows = useCallback((): Contact[] => {
    return Object.keys(rowSelection)
      .filter((key) => (rowSelection as Record<string, boolean | undefined>)[key])
      .map((key) => Number(key))
      .map((index) => tableRows[index])
      .filter((row): row is Contact => !!row);
  }, [rowSelection, tableRows]);

  const handleBulkDelete = useCallback(
    async (selectedRowsParam?: Contact[]) => {
      const selectedRows =
        selectedRowsParam && selectedRowsParam.length > 0
          ? selectedRowsParam
          : getFallbackSelectedRows();

      const ids = selectedRows
        .map((row) => row._id)
        .filter((id): id is string => !!id);

      if (ids.length === 0) {
        toast.error(t("select_rows_first", "בחר רשומות לעדכון"));
        return;
      }

      try {
        await Promise.all(ids.map((id) => usersApi.delete(id)));
        toast.success(t("deleted_successfully", "Successfully deleted item(s)"));
        setRowSelection({});
        tableMethods?.refresh();
      } catch (error) {
        console.error("Failed to delete contacts:", error);
        toast.error(t("delete_failed", "Failed to delete items"));
      }
    },
    [getFallbackSelectedRows, t, tableMethods]
  );

  const handleBulkAdvancedUpdate = useCallback(
    (selectedRowsParam?: Contact[]) => {
      const selectedRows =
        selectedRowsParam && selectedRowsParam.length > 0
          ? selectedRowsParam
          : getFallbackSelectedRows();

      if (selectedRows.length === 0) {
        toast.error(t("select_rows_first", "בחר רשומות לעדכון"));
        return;
      }

      setAdvancedUpdateRows(selectedRows);
      setIsAdvancedUpdateOpen(true);
    },
    [getFallbackSelectedRows, t]
  );

  const handleAdvancedUpdateConfirm = useCallback(
    async (field: string, value: string | string[]) => {
      const ids = advancedUpdateRows
        .map((row) => row._id)
        .filter((id): id is string => !!id);

      if (ids.length === 0) {
        toast.error(t("select_rows_first", "בחר רשומות לעדכון"));
        return;
      }

      const payload: Record<string, unknown> = {};
      if (field.startsWith("dynamicFields.")) {
        const key = field.replace("dynamicFields.", "");
        payload.dynamicFields = { [key]: value };
      } else {
        payload[field] = value;
      }

      try {
        await Promise.all(
          ids.map((id) =>
            usersApi.update({
              id,
              ...payload,
            })
          )
        );
        toast.success(t("updated_successfully", "Record updated successfully"));
        setIsAdvancedUpdateOpen(false);
        setAdvancedUpdateRows([]);
        setRowSelection({});
        tableMethods?.refresh();
      } catch (error) {
        console.error("Failed to perform advanced update:", error);
        toast.error(t("error", "An error occurred"));
      }
    },
    [advancedUpdateRows, t, tableMethods]
  );

  const selectedRowCount = advancedUpdateRows.length;

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("contacts")}</h1>
      <DataTable<Contact>
        data={[]}
        fetchData={(params) => {
          if (!organization?._id)
            return Promise.resolve({
              data: [],
              totalCount: 0,
              totalPages: 0,
            });
          return usersApi.fetchAll(params, false, organization._id);
        }}
        addData={handleCreateContact}
        updateData={usersApi.update}
        deleteData={usersApi.delete}
        columns={mergedColumns}
        searchable
        showAddButton
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        defaultPageSize={10}
        //@ts-ignore
        idField="_id"
        extraFilters={advancedFilters}
        organazitionId={organization?._id}
        entityType="contacts"
        rowSelection={rowSelection}
        onRowSelectionChange={useCallback((updater: any) => {
          setRowSelection((prev) =>
            typeof updater === "function" ? updater(prev) : updater
          );
        }, [])}
        visibleRows={useCallback((rows) => setTableRows(rows), [])}
        onRefreshReady={useCallback((methods) => setTableMethods(methods), [])}
        customLeftButtons={
          <div className="flex gap-2">
            <SmartLoadFromExcel />
            <Button
              variant="outline"
              onClick={() => setIsFieldConfigDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <Settings className="w-4 h-4 mr-2" />
              {t("configure_fields", "ערוך שדות דינאמיים")}
            </Button>
          </div>
        }
        addButtonWrapperClassName="flex-1 justify-center"
        addButtonClassName="px-8 py-3 text-lg min-w-[200px]"
        onBulkDelete={handleBulkDelete}
        onBulkAdvancedUpdate={handleBulkAdvancedUpdate}
      />
      <TableFieldConfigDialog
        open={isFieldConfigDialogOpen}
        onOpenChange={setIsFieldConfigDialogOpen}
        entityType="contacts"
        organizationId={organization?._id || ""}
        onSave={() => {
          tableMethods?.refresh();
        }}
      />
      <AdvancedUpdateDialog<Contact>
        open={isAdvancedUpdateOpen}
        onOpenChange={(open) => {
          setIsAdvancedUpdateOpen(open);
          if (!open) {
            setAdvancedUpdateRows([]);
          }
        }}
        columns={visibleColumns}
        onUpdate={handleAdvancedUpdateConfirm}
        selectedRowCount={selectedRowCount}
      />
    </div>
  );
}
