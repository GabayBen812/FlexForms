import { useMemo, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { courseSessionsApi } from "@/api/course-sessions";
import { CourseSession, CourseSessionStatus } from "@/types/courses/CourseSession";
import { formatDateForDisplay } from "@/lib/dateUtils";
import dayjs from "dayjs";
import "dayjs/locale/he";
import "dayjs/locale/en";
import { toast } from "@/hooks/use-toast";
import { MutationResponse } from "@/types/api/auth";
import { Badge } from "@/components/ui/badge";
import { TableEditButton } from "@/components/ui/completed/data-table/TableEditButton";
import { Checkbox } from "@/components/ui/checkbox";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { showConfirm } from "@/utils/swal";

interface SessionsTabProps {
  courseId: string;
}

const statusOptions: { value: CourseSessionStatus; label: string }[] = [
  { value: "NORMAL", label: "Normal" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "MOVED", label: "Moved" },
  { value: "TIME_CHANGED", label: "Time Changed" },
];

export function SessionsTab({ courseId }: SessionsTabProps) {
  const { t, i18n } = useTranslation();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: CourseSession) => void;
    updateItem: (item: CourseSession) => void;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<CourseSession[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});

  // Configure dayjs locale based on current language
  useEffect(() => {
    const locale = i18n.language === "he" ? "he" : "en";
    dayjs.locale(locale);
  }, [i18n.language]);

  const getStatusBadgeStyles = (status: CourseSessionStatus) => {
    switch (status) {
      case "NORMAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "MOVED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "TIME_CHANGED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: CourseSessionStatus) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  };

  const columns: ColumnDef<CourseSession>[] = useMemo(() => {
    // Custom selection column with edit icon
    const selectionColumn: ColumnDef<CourseSession> = {
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
              {selectedCount} {t("selected") || "selected"}
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
              setEditingSession(row.original);
              setIsEditDialogOpen(true);
            }}
          />
        </div>
      ),
      enableHiding: false,
      size: 150,
    };

    return [
      selectionColumn,
      {
        accessorKey: "date",
        header: t("date") || "Date",
        cell: ({ row }) => {
          const dateStr = formatDateForDisplay(row.original.date);
          if (!dateStr || !row.original.date) return "";
          
          try {
            const date = dayjs(row.original.date);
            if (!date.isValid()) return dateStr;
            
            const dayOfWeek = date.format("dddd"); // Full day name (e.g., "רביעי" or "Wednesday")
            return (
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium">{dateStr}</span>
                <span className="text-xs text-muted-foreground">{dayOfWeek}</span>
              </div>
            );
          } catch {
            return dateStr;
          }
        },
        meta: {
          isDate: true,
          editable: false,
          className: "text-center",
        },
        size: 150,
      },
      {
        accessorKey: "startDateTime",
        header: t("start_time") || "Start Time",
        cell: ({ row }) => {
          if (!row.original.startDateTime) return "";
          try {
            return dayjs(row.original.startDateTime).format("HH:mm");
          } catch {
            return "";
          }
        },
        meta: {
          editable: false,
          isTime: true,
          className: "text-center",
        },
        size: 120,
      },
      {
        accessorKey: "endDateTime",
        header: t("end_time") || "End Time",
        cell: ({ row }) => {
          if (!row.original.endDateTime) return "";
          try {
            return dayjs(row.original.endDateTime).format("HH:mm");
          } catch {
            return "";
          }
        },
        meta: {
          editable: false,
          isTime: true,
          className: "text-center",
        },
        size: 120,
      },
      {
        accessorKey: "status",
        header: t("status") || "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="flex justify-center">
              <Badge 
                variant="outline" 
                className={`text-sm font-medium ${getStatusBadgeStyles(status)}`}
              >
                {getStatusLabel(status)}
              </Badge>
            </div>
          );
        },
        meta: {
          editable: false,
          fieldType: "SELECT",
          options: statusOptions,
          className: "text-center",
        },
        size: 130,
      },
    ];
  }, [t]);

  const fetchSessionsData = useCallback(
    async (params?: ApiQueryParams): Promise<ApiResponse<CourseSession>> => {
      if (!organization?._id || !courseId) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        } as ApiResponse<CourseSession>;
      }

      const response = (await courseSessionsApi.fetchAll(
        {
          ...params,
          ...advancedFilters,
          courseId,
        },
        false,
        organization._id
      )) as MutationResponse<CourseSession[]>;

      if (response.error) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
        } as ApiResponse<CourseSession>;
      }

      const sessions = Array.isArray(response.data) ? response.data : [];
      
      return {
        data: sessions,
        totalCount: sessions.length,
        totalPages: 1,
      } as ApiResponse<CourseSession>;
    },
    [organization?._id, courseId, advancedFilters]
  );

  const handleDeleteSession = useCallback(
    async (id: string | number): Promise<MutationResponse<CourseSession>> => {
      const response = (await courseSessionsApi.delete(id)) as MutationResponse<CourseSession>;
      if (response.error) {
        toast({
          title: t("error") || "Error",
          description: response.error,
          variant: "destructive",
        });
        throw new Error(response.error);
      }
      await queryClient.invalidateQueries({ queryKey: ["course-sessions", courseId] });
      return response;
    },
    [courseId, queryClient, t]
  );

  const handleBulkDelete = useCallback(
    async (selectedRowsParam?: CourseSession[]) => {
      const fallbackSelectedRows = Object.keys(rowSelection)
        .map(Number)
        .map((index) => tableRows[index])
        .filter((row): row is CourseSession => !!row);

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
        const results = await Promise.all(selectedIds.map((id) => courseSessionsApi.delete(id)));
        
        const hasError = results.some((result) => result.error || (result.status && result.status >= 400));
        
        if (hasError) {
          const errorMessages = results
            .filter((result) => result.error)
            .map((result) => result.error)
            .join(", ");
          toast({
            variant: "destructive",
            title: t("delete_failed") || "Failed to delete items",
            description: errorMessages,
          });
          return;
        }
        
        toast({
          title: t("deleted_successfully") || "Successfully deleted item(s)",
        });
        setRowSelection({});
        tableMethods?.refresh();
      } catch (error) {
        console.error("Error deleting sessions:", error);
        toast({
          variant: "destructive",
          title: t("delete_failed") || "Failed to delete items",
        });
      }
    },
    [rowSelection, tableRows, tableMethods, t]
  );

  const handleEditSession = useCallback(
    async (data: any) => {
      if (!editingSession?._id) return;
      try {
        const updatedSession = {
          ...data,
          id: editingSession._id,
        };
        const res = await courseSessionsApi.update(updatedSession);
        if (res.status === 200 || res.data) {
          toast({
            title: t("updated_successfully") || "Record updated successfully",
          });
          setIsEditDialogOpen(false);
          setEditingSession(null);
          tableMethods?.updateItem(res.data);
          queryClient.invalidateQueries({ queryKey: ["course-sessions", courseId] });
        }
      } catch (error) {
        console.error("Error updating session:", error);
        toast({
          variant: "destructive",
          title: t("error") || "Error",
          description: error instanceof Error ? error.message : t("update_failed") || "Failed to update",
        });
        throw error;
      }
    },
    [editingSession, tableMethods, queryClient, courseId, t]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mt-6">
          <DataTable<CourseSession>
            data={[]}
            fetchData={fetchSessionsData}
            columns={columns}
            updateData={async () => {
              return { status: 200, data: {} as CourseSession };
            }}
            deleteData={handleDeleteSession}
            showAddButton={false}
            showEditButton={false}
            showDeleteButton={true}
            searchable={true}
            showAdvancedSearch={true}
            onAdvancedSearchChange={setAdvancedFilters}
            initialAdvancedFilters={advancedFilters}
            defaultPageSize={10}
            showPageSizeSelector={true}
            onRefreshReady={setTableMethods}
            idField="_id"
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
            onBulkDelete={handleBulkDelete}
            onExportSelected={useCallback(async (selectedRows: CourseSession[]) => {
              // Export functionality is handled by DataTable component
            }, [])}
            contentHeight="auto"
          />
        </div>
      </div>

      <AddRecordDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingSession(null);
          }
        }}
        columns={columns.filter((col) => col.id !== "select")}
        onAdd={async () => {
          // Not used in edit mode
        }}
        onEdit={handleEditSession}
        editMode={true}
        editData={editingSession ? {
          date: editingSession.date,
          startDateTime: editingSession.startDateTime,
          endDateTime: editingSession.endDateTime,
          status: editingSession.status,
        } : undefined}
        excludeFields={["organizationId", "courseId", "scheduleId", "createdAt", "updatedAt"]}
      />
    </div>
  );
}

