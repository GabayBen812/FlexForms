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
  getFilteredRowModel,
  FilterFn,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import DataTableBody from "./data-table-body";
import DataTableHeader from "./data-table-header";
import { DataTableSearch } from "./data-table-search";
import { DataTableAddButton } from "./data-table-add-button";
import { DataTableDownloadButton } from "./data-table-download-button";
import { DataTableAdvancedSearchBtn } from "./data-table-advanced-search-btn";
import {
  ApiQueryParams,
  DataTableProps,
  ColumnMeta,
  ExpandedContentProps,
} from "@/types/ui/data-table-types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdvancedSearchModal } from "./AdvancedSearchModal";

const globalFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const search = String(filterValue).toLowerCase();

  // Get all searchable values from the row
  const searchableValues = row
    .getAllCells()
    .filter((cell) => {
      const meta = cell.column.columnDef.meta as ColumnMeta;
      return !meta?.excludeFromSearch;
    })
    .map((cell) => {
      const value = cell.getValue();
      return value == null ? "" : String(value).toLowerCase();
    });

  // Check if any value includes the search term
  return searchableValues.some((value) => value.includes(search));
};

export function DataTable<TData>({
  fetchData,
  addData,
  updateData,
  deleteData,
  columns = [],
  searchable = true,
  showAdvancedSearch = false,
  onAdvancedSearchChange,
  initialAdvancedFilters = {},
  stickyColumnCount,
  isPagination = true,
  showAddButton = false,
  customAddButton,
  showActionColumn = false,
  showEditButton = false,
  showDeleteButton = false,
  showDuplicateButton = false,
  actions = null,
  defaultPageSize = 10,
  renderExpandedContent,
  idField,
  onRowClick,
  initialData,
  extraFilters = {},
  onRowSelectionChange,
  rowSelection = -1,
  enableColumnReordering,
  columnOrder,
  onColumnOrderChange,
  visibleRows,
}: DataTableProps<TData> & { extraFilters?: Record<string, any> }) {
  const [tableData, setTableData] = useState<TData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(
    initialAdvancedFilters
  );
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
    if (!idField) return;

    const id = row.original[idField] as string | number;
    const updatedData = { ...data, id };

    try {
      await updateData(updatedData);
      loadData();
    } catch (error) {
      console.error("Failed to update data:", error);
      toast.error(t("error"));
    }
  };
  const handleDeleteData = async (id: string | number) => {
    if (!deleteData || !idField) return;

    try {
      setIsLoading(true);
      await deleteData(id);
      await loadData(); // Refresh the table data
      toast.success(t("deleted_successfully"));
    } catch (error) {
      console.error("Failed to delete data:", error);
      toast.error(t("delete_failed"));
      // Refresh the table to ensure it's in sync
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
      columnOrder:
        columnOrder || columns.map((col) => (col as any).accessorKey as string),
    },
    globalFilterFn: globalFilterFn,
    onColumnOrderChange: onColumnOrderChange,
    enableRowSelection: !!onRowSelectionChange,
    onRowSelectionChange: onRowSelectionChange,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: false,
    enableFilters: true,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      handleAdd,
      handleEdit: handleUpdate,
      handleDelete: handleDeleteData,
    },
  });
  const selectedRowCount = table.getSelectedRowModel?.().rows.length ?? 0;
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

  const memoizedExtraFilters = useMemo(
    () => extraFilters,
    [JSON.stringify(extraFilters)]
  );

  useEffect(() => {
    loadData();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    globalFilter,
    memoizedExtraFilters,
  ]);

  useEffect(() => {
    if (visibleRows) {
      visibleRows(table.getRowModel().rows.map((row) => row.original));
    }
  }, [table.getRowModel().rows, visibleRows]);

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

  const handleAdvancedSearchApply = (filters: Record<string, any>) => {
    setAdvancedFilters(filters);
    onAdvancedSearchChange?.(filters);
    setIsAdvancedOpen(false);
  };

  const wrappedRenderExpandedContent = renderExpandedContent
    ? (props: ExpandedContentProps<TData>) => {
        const wrappedHandleSave = async (data: Partial<TData>) => {
          await props.handleSave?.(data);
        };
        return renderExpandedContent({ handleSave: wrappedHandleSave });
      }
    : undefined;

  const wrappedOnRowClick = onRowClick
    ? (row: Row<TData>) => onRowClick(row.original)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {searchable && (
            <>
              <div className="text-sm text-black font-medium">
                {t("total_rows")} :{" "}
                {table.getPrePaginationRowModel().rows.length}
              </div>
              <DataTableSearch
                table={table}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
              <DataTableDownloadButton table={table as any} />
            </>
          )}
          <DataTableAdvancedSearchBtn
            showAdvancedSearch={showAdvancedSearch}
            columns={columns}
            onAdvancedSearchChange={onAdvancedSearchChange}
            initialAdvancedFilters={initialAdvancedFilters}
          />
        </div>
        <div className="flex items-center gap-4">
          {customAddButton || (
            <DataTableAddButton
              showAddButton={showAdd}
              columns={columns}
              onAdd={handleAdd}
              excludeFields={excludeFields}
            />
          )}
        </div>
      </div>

      {showAdvancedSearch && (
        <AdvancedSearchModal
          open={isAdvancedOpen}
          onClose={() => setIsAdvancedOpen(false)}
          columns={columns}
          onApply={handleAdvancedSearchApply}
          initialFilters={advancedFilters}
        />
      )}

      <div className="rounded-lg">
        <Table className="border-collapse border-spacing-0 text-right">
          <DataTableHeader
            table={table}
            actions={showActionColumn ? [] : null}
            enableColumnReordering={enableColumnReordering}
            stickyColumnCount={stickyColumnCount}
            selectedRowCount={selectedRowCount}
            enableRowSelection={!!onRowSelectionChange}
          />
          <DataTableBody<TData>
            columns={columns}
            table={table}
            actions={actions}
            stickyColumnCount={stickyColumnCount}
            renderExpandedContent={wrappedRenderExpandedContent}
            specialRow={specialRow}
            setSpecialRow={setSpecialRow}
            handleSave={handleAdd}
            handleEdit={handleUpdate}
            isLoading={isLoading}
            onRowClick={wrappedOnRowClick}
            showActionColumn={showActionColumn}
            showEditButton={showEditButton}
            showDeleteButton={showDeleteButton}
            showDuplicateButton={showDuplicateButton}
          />
        </Table>
      </div>
    </div>
  );
}

export default DataTable;
