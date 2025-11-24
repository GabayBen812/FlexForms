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
import { useQuery } from "@tanstack/react-query";
import { fetchAllAccounts } from "@/api/accounts";
import { Account } from "@/types/accounts/account";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { ProfileAvatar, getProfileImageUrl } from "@/components/ProfileAvatar";

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Fetch accounts for relationship options
  const { data: accountsData } = useQuery({
    queryKey: ["accounts-options", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return { data: { data: [], totalCount: 0, totalPages: 0 } };
      const response = await fetchAllAccounts({}, organization._id);
      return response;
    },
    enabled: !!organization?._id,
  });

  const accountsOptions = useMemo(
    () =>
      (accountsData?.data?.data || []).map((account: Account) => ({
        value: account._id || "",
        label: account.name,
      })),
    [accountsData],
  );

  // Fix: Memoize selectionColumn to prevent recreation on every render
  const selectionColumn: ColumnDef<Contact> = useMemo(
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
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(event) => event.stopPropagation()}
            aria-label="Select row"
          />
        </div>
      ),
    }),
    [] // Empty deps - selectionColumn doesn't depend on any props/state
  );

  // Fix: Memoize baseColumns to prevent recreation, but only depend on t
  // selectionColumn is now memoized, so it has a stable reference
  const baseColumns: ColumnDef<Contact>[] = useMemo(
    () => [
      selectionColumn,
      {
        id: "profilePicture",
        header: t("profile_picture", "תמונת פרופיל"),
        enableSorting: false,
        size: 90,
        meta: { editable: false, excludeFromSearch: true },
        cell: ({ row }) => {
          const contact = row.original;
          const imageUrl = getProfileImageUrl(contact);
          const name = [contact.firstname, contact.lastname].filter(Boolean).join(" ");

          return (
            <div className="flex justify-center">
              <ProfileAvatar name={name} imageUrl={imageUrl} size="sm" />
            </div>
          );
        },
      },
      {
        accessorKey: "firstname",
        header: t("firstname"),
        meta: { required: true },
      },
      {
        accessorKey: "lastname",
        header: t("lastname"),
        meta: { required: false },
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
      {
        accessorKey: "accountId",
        header: t("relevant_account", "חשבון רלוונטי"),
        meta: {
          relationshipOptions: accountsOptions,
          singleSelect: true,
          editable: true,
          required: false,
        },
      },
    ],
    [t, selectionColumn, accountsOptions] // Include selectionColumn and accountsOptions
  );

  // Fix: Include baseColumns in dependency array - it's now memoized
  // Update columns with current accountsOptions after merging
  const mergedColumns = useMemo(() => {
    const merged = mergeColumnsWithDynamicFields(
      baseColumns,
      "contacts",
      organization,
      (key) => t(key)
    );
    // Update accountId column with current accountsOptions
    return merged.map((col) => {
      if ((col as any).accessorKey === "accountId") {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            relationshipOptions: accountsOptions,
          },
        };
      }
      return col;
    });
  }, [baseColumns, organization, t, accountsOptions]);

  // Fix: Remove useMemo from visibleColumns - just make it a simple filter
  const visibleColumns = mergedColumns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  const handleCreateContact = useCallback(
    async (data: Partial<Contact>): Promise<void> => {
      if (!organization?._id) {
        throw new Error("Organization is missing");
      }

      try {
        const { firstname, lastname, email, phone, accountId, ...rest } = data;

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
        const normalizedAccountId = accountId && accountId.toString().trim() !== "" ? accountId.toString().trim() : undefined;

        const res = await usersApi.create({
          ...cleanedRest,
          firstname: firstname?.toString().trim() ?? "",
          lastname: lastname?.toString().trim() ?? "",
          email: normalizedEmail ? normalizedEmail : undefined,
          phone: normalizedPhone ? normalizedPhone : undefined,
          accountId: normalizedAccountId,
          organizationId: organization._id,
          type: "contact",
          status: "active",
          ...(dynamicFields ? { dynamicFields } : {}),
        });

        if (res.error) {
          const errorMessage = res.error || t("error") || "Failed to create contact";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        if ((res.status === 200 || res.status === 201) && res.data) {
          toast.success(t("form_created_success"));
          setIsAddDialogOpen(false);
          tableMethods?.addItem?.(res.data);
        } else {
          toast.success(t("form_created_success"));
          setIsAddDialogOpen(false);
          tableMethods?.refresh();
        }
      } catch (error) {
        console.error("Error creating contact:", error);
        const errorMessage =
          error instanceof Error ? error.message : t("error");
        toast.error(errorMessage || t("error"));
        throw error;
      }
    },
    [organization?._id, t, tableMethods]
  );

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
        // Handle accountId as single value (not array)
        if (field === "accountId") {
          payload[field] = value && typeof value === "string" && value.trim() !== "" ? value.trim() : null;
        } else {
          payload[field] = value;
        }
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

  // Fix: Move callbacks outside of JSX to prevent recreation on every render
  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  const handleVisibleRows = useCallback((rows: Contact[]) => {
    setTableRows(rows);
  }, []);

  const handleRefreshReady = useCallback((methods: {
    refresh: () => void;
    addItem?: (item: Contact) => void;
    updateItem?: (item: Contact) => void;
  }) => {
    setTableMethods(methods);
  }, []);

  // Fix: Memoize fetchData to prevent recreation on every render
  const fetchData = useCallback(
    (params: any) => {
      if (!organization?._id)
        return Promise.resolve({
          data: [],
          totalCount: 0,
          totalPages: 0,
        });
      return usersApi.fetchAll(params, false, organization._id);
    },
    [organization?._id]
  );

  const selectedRowCount = advancedUpdateRows.length;

  // Fix: Memoize onSave callback for TableFieldConfigDialog
  const handleFieldConfigSave = useCallback(() => {
    tableMethods?.refresh();
  }, [tableMethods]);

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("contacts")}</h1>
      <DataTable<Contact>
        data={[]}
        fetchData={fetchData}
        addData={handleCreateContact}
        updateData={usersApi.update}
        deleteData={usersApi.delete}
        columns={mergedColumns}
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
        entityType="contacts"
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        visibleRows={handleVisibleRows}
        onRefreshReady={handleRefreshReady}
        customLeftButtons={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 hover:border-green-700"
            >
              {t("add")}
            </Button>
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
        onBulkDelete={handleBulkDelete}
        onBulkAdvancedUpdate={handleBulkAdvancedUpdate}
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={mergedColumns}
        onAdd={handleCreateContact}
        excludeFields={["organizationId", "type", "status"]}
        relationshipFields={{
          accountId: {
            options: accountsOptions,
          },
        }}
        defaultValues={{
          organizationId: organization?._id || "",
          type: "contact",
          status: "active",
        }}
      />
      <AddRecordDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingContact(null);
          }
        }}
        columns={mergedColumns}
        onAdd={handleCreateContact}
        onEdit={async (data) => {
          if (!editingContact?._id) return;
          try {
            const { firstname, lastname, email, phone, accountId, ...rest } = data;

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
            const normalizedAccountId = accountId && accountId.toString().trim() !== "" ? accountId.toString().trim() : undefined;

            await usersApi.update({
              id: editingContact._id,
              ...cleanedRest,
              firstname: firstname?.toString().trim() ?? "",
              lastname: lastname?.toString().trim() ?? "",
              email: normalizedEmail ? normalizedEmail : undefined,
              phone: normalizedPhone ? normalizedPhone : undefined,
              accountId: normalizedAccountId,
              ...(dynamicFields ? { dynamicFields } : {}),
            });
            toast.success(t("updated_successfully", "Record updated successfully"));
            tableMethods?.refresh();
            setIsEditDialogOpen(false);
            setEditingContact(null);
          } catch (error) {
            console.error("Failed to update contact:", error);
            toast.error(t("error", "An error occurred"));
            throw error;
          }
        }}
        editMode
        editData={editingContact ? {
          firstname: editingContact.firstname,
          lastname: editingContact.lastname,
          email: editingContact.email || "",
          phone: editingContact.phone || "",
          accountId: editingContact.accountId || "",
          ...(editingContact.dynamicFields ? { dynamicFields: editingContact.dynamicFields } : {}),
        } : undefined}
        relationshipFields={{
          accountId: {
            options: accountsOptions,
          },
        }}
        excludeFields={["organizationId", "type", "status"]}
        defaultValues={{
          organizationId: organization?._id || "",
          type: "contact",
          status: "active",
        }}
      />
      <TableFieldConfigDialog
        open={isFieldConfigDialogOpen}
        onOpenChange={setIsFieldConfigDialogOpen}
        entityType="contacts"
        organizationId={organization?._id || ""}
        onSave={handleFieldConfigSave}
      />
      <AdvancedUpdateDialog<Contact>
        open={isAdvancedUpdateOpen}
        onOpenChange={(open) => {
          setIsAdvancedUpdateOpen(open);
          if (!open) {
            setAdvancedUpdateRows([]);
          }
        }}
        columns={mergedColumns}
        onUpdate={handleAdvancedUpdateConfirm}
        selectedRowCount={selectedRowCount}
      />
    </div>
  );
}
