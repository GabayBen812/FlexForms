import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useState, useCallback, useMemo } from "react";
import { Plus, Settings } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { Expense } from "@/types/expenses/expense";
import expenseService from "@/api/services/expenseService";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { TableFieldConfigDialog } from "@/components/ui/completed/dialogs/TableFieldConfigDialog";
import { AdvancedUpdateDialog } from "@/components/AdvancedUpdateDialog";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { showConfirm } from "@/utils/swal";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "Cash", label: "מזומן" },
  { value: "Credit Card", label: "כרטיס אשראי" },
  { value: "Bank Transfer", label: "העברה בנקאית" },
  { value: "Check", label: "צ'ק" },
];

const DEFAULT_CATEGORIES = [
  "אספקה משרדית",
  "שירותים",
  "נסיעות",
  "אוכל",
  "ציוד",
  "אחר",
];

export default function Expenses() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFieldConfigDialogOpen, setIsFieldConfigDialogOpen] = useState(false);
  const [isAdvancedUpdateOpen, setIsAdvancedUpdateOpen] = useState(false);
  const [advancedUpdateCount, setAdvancedUpdateCount] = useState(0);
  const [advancedUpdateRows, setAdvancedUpdateRows] = useState<Expense[]>([]);
  const [isAdvancedUpdating, setIsAdvancedUpdating] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Expense) => void;
    updateItem: (item: Expense) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<Expense[]>([]);

  // Get category options from organization or use defaults
  const categoryOptions = useMemo(() => {
    const dynamicFields = organization?.tableFieldDefinitions?.expenses?.fields;
    const categoryField = dynamicFields?.category;
    const customChoices = categoryField?.choices || [];
    const allCategories = [...DEFAULT_CATEGORIES, ...customChoices];
    // Remove duplicates
    const uniqueCategories = Array.from(new Set(allCategories));
    return uniqueCategories.map((cat) => ({ value: cat, label: cat }));
  }, [organization]);

  // Hebrew translated payment methods for display
  const paymentMethodOptions = useMemo(() => PAYMENT_METHODS, []);

  const selectionColumn: ColumnDef<Expense> = {
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
            setEditingExpense(row.original);
            setIsEditDialogOpen(true);
          }}
        />
      </div>
    ),
    enableHiding: false,
    size: 150,
  };

  const columns: ColumnDef<Expense>[] = [
    selectionColumn,
    {
      accessorKey: "date",
      header: t("date") || "תאריך",
      meta: {
        isDate: true,
        editable: true,
      },
      cell: ({ getValue }) => {
        const value = getValue();
        return formatDateForDisplay(value as string | Date | null | undefined);
      },
    },
    {
      accessorKey: "amount",
      header: t("amount") || "סכום",
      meta: {
        fieldType: "MONEY",
        editable: true,
        isMoney: true,
      },
      cell: ({ getValue }) => {
        const value = getValue();
        if (!value) return "";
        return `₪${parseFloat(String(value)).toLocaleString("he-IL", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      accessorKey: "supplierId",
      header: t("supplier") || "ספק",
      meta: {
        editable: true,
        hidden: true, // Hidden for now as suppliers entity doesn't exist yet
      },
    },
    {
      accessorKey: "category",
      header: t("category") || "קטגוריה",
      meta: {
        fieldType: "MULTI_SELECT",
        editable: true,
        options: categoryOptions,
      },
      cell: ({ getValue }) => {
        const value = getValue();
        const normalizedValues = Array.isArray(value) ? value : [];
        
        const labels = normalizedValues
          .map((val) => {
            const option = categoryOptions.find((opt) => opt.value === val);
            return option?.label || val;
          })
          .filter((label) => label);

        if (!labels.length) {
          return <div className="px-2 py-1 rounded min-h-[1.5rem]" />;
        }

        return (
          <div className="px-2 py-1 rounded min-h-[1.5rem] flex flex-wrap gap-1 justify-center items-center">
            {labels.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium border",
                  "bg-blue-100 text-blue-800 border-blue-300"
                )}
              >
                <span>{label}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentMethod",
      header: t("payment_method") || "אמצעי תשלום",
      meta: {
        fieldType: "SELECT",
        editable: true,
        options: paymentMethodOptions,
      },
      cell: ({ getValue }) => {
        const value = getValue();
        const option = paymentMethodOptions.find((opt) => opt.value === value);
        return option?.label || value || "";
      },
    },
    {
      accessorKey: "invoicePicture",
      header: t("invoice_picture") || "תמונת חשבונית",
      meta: {
        fieldType: "IMAGE",
        editable: true,
        isImage: true,
      },
    },
    {
      accessorKey: "notes",
      header: t("notes") || "הערות",
      meta: {
        editable: true,
      },
    },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];

  const visibleColumns = columns.filter(
    //@ts-ignore
    (col) => !col.meta?.hidden
  );

  const mergedColumns = useMemo(() => {
    return mergeColumnsWithDynamicFields(
      visibleColumns,
      "expenses",
      organization,
      t
    );
  }, [visibleColumns, organization, t, categoryOptions]);

  const actions: TableAction<Expense>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const handleAddExpense = async (data: any) => {
    try {
      const newExpense = {
        ...data,
        organizationId: organization?._id || "",
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        amount: parseFloat(data.amount) || 0,
        category: Array.isArray(data.category) ? data.category : data.category ? [data.category] : [],
        paymentMethod: data.paymentMethod || "Cash",
        ...(data.invoicePicture && { invoicePicture: data.invoicePicture }),
        ...(data.notes && { notes: data.notes }),
        ...(data.supplierId && { supplierId: data.supplierId }),
        ...(data.dynamicFields && { dynamicFields: data.dynamicFields }),
      };
      const res = await expenseService.create(newExpense);

      if (res.error) {
        const errorMessage = res.error || t("error") || "Failed to create expense";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if ((res.status === 200 || res.status === 201) && res.data) {
        const createdExpense = res.data;
        toast.success(t("expense_created_successfully") || "הוצאה נוצרה בהצלחה");
        setIsAddDialogOpen(false);
        tableMethods?.addItem(createdExpense);
      } else {
        const errorMessage = res.error || t("error") || "Failed to create expense";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating expense:", error);
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

  const handleEditExpense = async (data: any) => {
    if (!editingExpense?._id) return;
    try {
      const updatedExpense: any = {
        id: editingExpense._id,
        organizationId: organization?._id || "",
      };

      if (data.date) {
        updatedExpense.date = new Date(data.date).toISOString();
      }
      if (data.amount !== undefined) {
        updatedExpense.amount = parseFloat(data.amount) || 0;
      }
      if (data.category !== undefined) {
        updatedExpense.category = Array.isArray(data.category) ? data.category : data.category ? [data.category] : [];
      }
      if (data.paymentMethod !== undefined) {
        updatedExpense.paymentMethod = data.paymentMethod;
      }
      if (data.invoicePicture !== undefined) {
        updatedExpense.invoicePicture = data.invoicePicture;
      }
      if (data.notes !== undefined) {
        updatedExpense.notes = data.notes;
      }
      if (data.supplierId !== undefined) {
        updatedExpense.supplierId = data.supplierId;
      }
      if (data.dynamicFields) {
        updatedExpense.dynamicFields = data.dynamicFields;
      }

      const res = await expenseService.update(updatedExpense);
      if (res.status === 200 || res.data) {
        const updatedExpenseData = res.data;
        toast.success(
          t("updated_successfully") || "Record updated successfully"
        );
        setIsEditDialogOpen(false);
        setEditingExpense(null);
        tableMethods?.updateItem(updatedExpenseData);
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async (selectedRowsParam?: Expense[]) => {
    const fallbackSelectedRows = Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Expense => !!row);

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
      await Promise.all(selectedIds.map((id) => expenseService.delete(id)));
      toast.success(t("deleted_successfully") || "Successfully deleted item(s)");
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting expenses:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  const getFallbackSelectedRows = useCallback((): Expense[] => {
    return Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Expense => !!row);
  }, [rowSelection, tableRows]);

  const handleBulkAdvancedUpdate = (selectedRowsParam: Expense[]) => {
    const rowsToUpdate = selectedRowsParam.length
      ? selectedRowsParam
      : getFallbackSelectedRows();

    if (!rowsToUpdate.length) {
      toast.error(t("select_rows_first") || "בחר רשומות לעדכון");
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
      toast.error(t("select_rows_first") || "בחר רשומות לעדכון");
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
          expenseService.update({
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
      <h2 className="text-xl font-semibold text-primary mb-4">
        {t("expenses") || "הוצאות"}
      </h2>

      <DataTable<Expense>
        data={[]}
        fetchData={useCallback(
          (params) => {
            if (!organization?._id)
              return Promise.resolve({ status: 200, data: [] });
            return expenseService.fetchAll(params, false, organization._id);
          },
          [organization?._id]
        )}
        addData={expenseService.create}
        updateData={expenseService.update}
        deleteData={expenseService.delete}
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
        entityType="expenses"
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
              {t("configure_fields") || "ערוך שדות דינאמיים"}
            </Button>
          </div>
        }
        onBulkDelete={handleBulkDelete}
      />

      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={mergedColumns}
        onAdd={handleAddExpense}
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
            setEditingExpense(null);
          }
        }}
        columns={mergedColumns}
        onAdd={handleAddExpense}
        onEdit={handleEditExpense}
        editMode={true}
        editData={
          editingExpense
            ? {
                date: editingExpense.date
                  ? formatDateForDisplay(editingExpense.date)
                  : "",
                amount: editingExpense.amount || 0,
                category: editingExpense.category || [],
                paymentMethod: editingExpense.paymentMethod || "Cash",
                invoicePicture: editingExpense.invoicePicture || "",
                notes: editingExpense.notes || "",
                supplierId: editingExpense.supplierId || "",
                ...(editingExpense.dynamicFields
                  ? { dynamicFields: editingExpense.dynamicFields }
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
        entityType="expenses"
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
