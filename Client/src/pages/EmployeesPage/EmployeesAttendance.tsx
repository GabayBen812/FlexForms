import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState, Table } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/hooks/useOrganization";
import { fetchAttendanceByOrganization } from "@/api/attendance";
import { AttendanceShift } from "@/types/attendance";
import DataTable from "@/components/ui/completed/data-table";
import { useMemo, useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function EmployeesAttendance() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [tableRows, setTableRows] = useState<AttendanceShift[]>([]);

  const { data: attendanceData, isLoading, error } = useQuery({
    queryKey: ["attendance", organization?._id],
    queryFn: () => {
      if (!organization?._id) {
        return Promise.resolve([]);
      }
      return fetchAttendanceByOrganization(organization._id);
    },
    enabled: !!organization?._id,
  });

  const selectionColumn: ColumnDef<AttendanceShift> = useMemo(
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
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              className="border-white"
            />
            <span className="text-xs text-white">
              {selectedCount} {t("selected") || "נבחרו"}
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
        </div>
      ),
      enableHiding: false,
      size: 150,
    }),
    [t]
  );

  const columns: ColumnDef<AttendanceShift>[] = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "employeeName",
        header: t("employee_name") || "Employee Name",
        meta: { editable: false },
      },
      {
        accessorKey: "reportedDate",
        header: t("reported_date") || "Reported Date",
        meta: { editable: false },
      },
      {
        accessorKey: "startTime",
        header: t("start_time") || "Start Time",
        meta: { editable: false },
      },
      {
        accessorKey: "pauseTime",
        header: t("pause_time") || "Pause Time",
        cell: ({ row }) => row.original.pauseTime || "-",
        meta: { editable: false },
      },
      {
        accessorKey: "resumeTime",
        header: t("resume_time") || "Resume Time",
        cell: ({ row }) => row.original.resumeTime || "-",
        meta: { editable: false },
      },
      {
        accessorKey: "stopTime",
        header: t("stop_time") || "Stop Time",
        cell: ({ row }) => row.original.stopTime || "-",
        meta: { editable: false },
      },
      {
        accessorKey: "totalTime",
        header: t("total_time") || "Total Time",
        meta: { editable: false },
      },
    ],
    [t, selectionColumn]
  );

  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection((prev) => {
      if (typeof updater === "function") {
        return updater(prev);
      } else {
        return updater;
      }
    });
  }, []);

  const handleVisibleRows = useCallback((rows: AttendanceShift[]) => {
    setTableRows(rows);
  }, []);

  const handleFetchData = useCallback(
    async () => {
      if (!organization?._id) {
        return { status: 200, data: [] };
      }
      const data = await fetchAttendanceByOrganization(organization._id);
      return {
        status: 200,
        data,
        totalCount: data.length,
        totalPages: 1,
      };
    },
    [organization?._id]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>{t("loading") || "Loading..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">
          {t("error_loading_attendance") || "Error loading attendance data"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <DataTable<AttendanceShift>
        data={attendanceData || []}
        initialData={attendanceData || []}
        fetchData={handleFetchData}
        updateData={undefined}
        columns={columns}
        searchable
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        extraFilters={advancedFilters}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        visibleRows={handleVisibleRows}
        //@ts-ignore
        idField="_id"
        isPagination={false}
        defaultPageSize={50}
      />
    </div>
  );
}

