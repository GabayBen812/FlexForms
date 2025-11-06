import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { Plus, Trash } from "lucide-react";
import DataTable from "@/components/ui/completed/data-table";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { User } from "@/types/users/user";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { TableAction } from "@/types/ui/data-table-types";
import { showConfirm } from "@/utils/swal";

const usersApi = createApiService<User>("/users");

type UserColumnMeta = { hidden?: boolean };

export default function Users() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: User) => void;
    updateItem: (item: User) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Custom selection column with edit icon
  const selectionColumn: ColumnDef<User> = {
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
            setEditingUser(row.original);
            setIsEditDialogOpen(true);
          }}
        />
      </div>
    ),
    enableHiding: false,
    size: 150,
  };

  const columns: ColumnDef<User, any>[] = [
    selectionColumn,
    { accessorKey: "name", header: t("user_name") },
    { accessorKey: "email", header: t("user_email") },
    { accessorKey: "role", header: t("user_role") },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];
  //@ts-ignore
  const visibleColumns = columns.filter((col) => !col.meta?.hidden);

  const actions: TableAction<User>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const handleAddUser = async (data: any) => {
    try {
      const newUser = {
        ...data,
        organizationId: organization?._id || "",
      };
      const res = await usersApi.create(newUser);
      
      // Check for errors in response
      if (res.error) {
        const errorMessage = res.error || t("error") || "Failed to create user";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check if response is successful
      if (res.status === 200 && res.data) {
        const createdUser = res.data;
        toast.success(t("form_created_success"));
        setIsAddDialogOpen(false);
        // Add item directly to table without refresh
        tableMethods?.addItem(createdUser);
      } else {
        const errorMessage = res.error || t("error") || "Failed to create user";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message 
        || (error as any)?.error 
        || t("error") || "An error occurred";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleEditUser = async (data: any) => {
    if (!editingUser?._id) return;
    try {
      const updatedUser = {
        ...data,
        id: editingUser._id,
        organizationId: organization?._id || "",
      };
      const res = await usersApi.update(updatedUser);
      if (res.status === 200 || res.data) {
        const updatedUserData = res.data;
        toast.success(t("updated_successfully") || "Record updated successfully");
        setIsEditDialogOpen(false);
        setEditingUser(null);
        // Update item directly in table without refresh
        tableMethods?.updateItem(updatedUserData);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(t("error"));
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedRows = selectedIndices.map((index) => tableRows[index]).filter((row): row is User => !!row);
    const selectedIds = selectedRows.map((row) => row._id).filter((id): id is string => !!id);
    
    if (selectedIds.length === 0) return;
    
    const confirmed = await showConfirm(
      t("confirm_delete") || t("common:confirm_delete") || "Are you sure?"
    );
    
    if (!confirmed) return;
    
    try {
      await Promise.all(selectedIds.map((id) => usersApi.delete(id)));
      toast.success(t("deleted_successfully") || "Successfully deleted item(s)");
      setRowSelection({});
      tableMethods?.refresh();
    } catch (error) {
      console.error("Error deleting users:", error);
      toast.error(t("delete_failed") || "Failed to delete items");
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("users")}</h1>
      <DataTable<User>
        data={users}
        updateData={usersApi.update}
        fetchData={useCallback(async (params) => {
          if (!organization?._id) return { status: 200, data: [] };
          const result = await usersApi.fetchAll(
            params,
            false,
            organization._id
          );
          if ("data" in result && Array.isArray(result.data))
            setUsers(result.data);
          return result;
        }, [organization?._id])}
        addData={usersApi.create}
        deleteData={usersApi.delete}
        columns={visibleColumns}
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
              className="bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
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
          </div>
        }
        onRowClick={(user) => {}}
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={visibleColumns}
        onAdd={handleAddUser}
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
            setEditingUser(null);
          }
        }}
        columns={visibleColumns}
        onAdd={handleAddUser}
        onEdit={handleEditUser}
        editMode={true}
        editData={editingUser ? {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        } : undefined}
        excludeFields={["organizationId"]}
        defaultValues={{
          organizationId: organization?._id || "",
        }}
      />
    </div>
  );
}
