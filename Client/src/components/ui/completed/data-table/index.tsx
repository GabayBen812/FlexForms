import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  PaginationState,
  Row,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import DataTableBody from "./data-table-body";
import DataTableHeader from "./data-table-header";
import { DataTableSearch } from "./data-table-search";
import { DataTableAddButton } from "./data-table-add-button";
import { DataTableDownloadButton } from "./data-table-download-button";
import { ApiQueryParams, DataTableProps } from "@/types/ui/data-table-types";
import { toast } from "sonner";

export function DataTable<TData>({
  fetchData,
  addData,
  updateData,
  deleteData,
  columns = [],
  searchable = true,
  isPagination = true,
  showAddButton = false,
  actions = null,
  defaultPageSize = 10,
  renderExpandedContent,
  idField,
  onRowClick,
  initialData,
  extraFilters = {},
  onRowSelectionChange,
  rowSelection,
  enableColumnReordering,
  columnOrder,
  onColumnOrderChange,
}: DataTableProps<TData> & { extraFilters?: Record<string, any> }) {
  const [tableData, setTableData] = useState<TData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [specialRow, setSpecialRow] = useState<"add" | null>(null);
  
  // Determine excludeFields and pass to DataTableAddButton
  let excludeFields = [];
  if (Array.isArray(showAddButton)) {
    excludeFields = showAddButton;
  }
  const showAdd = !!showAddButton;

  const handleAdd = async (newData: Partial<TData>) => {
    if (!addData || !idField) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticData = { ...newData, id: tempId } as TData;

    setTableData((prev) => [...prev, optimisticData]);

    setSpecialRow(null);
    try {
      const response = await addData(newData);

      const createdItem = response.data;
      setTableData(
        (prev) =>
          prev.map((item) =>
            (item as TData)[idField] === tempId ? createdItem : item
          ) as TData[]
      );

      toast.success("Event has been created");
      table.setPageIndex(0);
    } catch (error) {
      console.error("Failed to add data:", error);

      setTableData((prev) =>
        prev.filter((item) => (item as TData)[idField] !== tempId)
      );

      toast.error("Failed to create event");
    }
  };

  const handleUpdate = async (row: Row<TData>, data: Partial<TData>) => {
    const updatedData = {
      ...row.original,
      ...data,
      id: row.original[idField as keyof TData] as string | number
    };
    await updateData(updatedData);
    toast.success(t("changes_updated_successfully"));
  };

  const handleDeleteData = async (id: string | number) => {
    if (!deleteData || !idField) return;

    try {
      setTableData((prev) => prev.filter((item) => item[idField] !== id));
      await deleteData(Number(id));
      toast("Event has been created", {});
    } catch (error) {
      console.error("Failed to delete data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    columnResizeMode: "onChange",
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
      columnOrder: columnOrder || columns.map(col => (col as any).accessorKey as string),
    },
    onColumnOrderChange: onColumnOrderChange,
    enableRowSelection: true,
    onRowSelectionChange: onRowSelectionChange, 
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    meta: {
      handleAdd,
      handleEdit: handleUpdate,
      handleDelete: handleDeleteData,
    },
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params: ApiQueryParams = {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: globalFilter || undefined,
        ...extraFilters,
      };

      if (sorting.length > 0) {
        const sortColumn = sorting[0];
        params.sortField = String(sortColumn.id);
        params.sortDirection = sortColumn.desc ? "desc" : "asc";
      }

      const response = await fetchData(params);

      if ("totalCount" in response) {
        // This is an ApiResponse<TData>
        setTableData(response.data || []);
        setTotalCount(response.totalCount || 0);
      } else {
        // This is a MutationResponse<TData>
        setTableData(response.data ? response.data : []);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const memoizedExtraFilters = useMemo(() => extraFilters, [JSON.stringify(extraFilters)]);

  useEffect(() => {
    loadData();
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter, memoizedExtraFilters]);
  

  const toggleAddRow = () => {
    setSpecialRow((prev) => (prev === "add" ? null : "add"));
  };

  const enhancedActions = actions
    ? actions.map((action) => {
        if (action?.type === "edit") {
          return {
            ...action,
            onClick: async (row: Row<TData>) => {
              if (action.onClick) action.onClick(row);
              else row.toggleExpanded();
            },
          };
        }
        if (action?.type === "delete") {
          return {
            ...action,
            onClick: async (row: Row<TData>) => {
              if (action.onClick) action.onClick(row);

              if (idField && deleteData) {
                const id = row.original[idField] as unknown as string | number;
                await handleDeleteData(id);
              }
            },
          };
        }
        return action;
      })
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between w-full">
        {searchable && (
          <div className="flex items-center gap-2">
            <DataTableSearch
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
            <DataTableDownloadButton table={table as any} />
          </div>
        )}
        <div className="flex items-center">
          <DataTableAddButton
            showAddButton={showAdd}
            columns={columns}
            onAdd={handleAdd}
            excludeFields={excludeFields}
          />
        </div>
      </div>
      <div className="rounded-lg">
        <Table className="border-collapse border-spacing-2 text-right">
          <DataTableHeader table={table} actions={enhancedActions} 
          enableColumnReordering={enableColumnReordering} />
          <DataTableBody<TData>
            columns={columns}
            table={table}
            actions={enhancedActions}
            renderExpandedContent={renderExpandedContent as any}
            specialRow={specialRow}
            setSpecialRow={setSpecialRow}
            handleSave={handleAdd}
            handleEdit={(row) => handleUpdate(row as any, row)}
            isLoading={isLoading}
            onRowClick={(row) => onRowClick?.(row.original)}
          />
        </Table>
      </div>
    </div>
  );
}

export default DataTable;
