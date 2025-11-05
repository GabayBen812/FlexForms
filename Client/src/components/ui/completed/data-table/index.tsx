import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { DataTablePaginationControls } from "./data-table-pagination-controls";
import { DataTableLoading } from "./data-table-loading";

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
  customLeftButtons,
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
  isLazyLoading = false,
  organazitionId,
  onRefreshReady,
  refreshTrigger,
  entityType,

}: DataTableProps<TData> & { extraFilters?: Record<string, any>; customLeftButtons?: React.ReactNode }) {
  const [tableData, setTableData] = useState<TData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
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
  
  // Internal state for column order - persist it even if parent doesn't manage it
  const defaultColumnOrder = useMemo(
    () => columns.map((col) => (col as any).id || (col as any).accessorKey as string),
    [columns]
  );
  const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(
    columnOrder || defaultColumnOrder
  );
  
  // Update internal state when prop changes
  useEffect(() => {
    if (columnOrder) {
      setInternalColumnOrder(columnOrder);
    }
  }, [columnOrder]);

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
     const dataToSend = {
    ...newData,
    organizationId: organazitionId, 
  };
  console.log("Data to send:", dataToSend);
    setTableData((prev) => [...prev, optimisticData]);

    setSpecialRow(null);
    try {
      const response = await addData(dataToSend);

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

  // const handleUpdate = async (row: Row<TData>, data: Partial<TData>) => {
  //   if (!idField) return;

  //   const id = row.original[idField] as string | number;
  //   const updatedData = { ...data, id };

  //   try {
  //     await updateData(updatedData);
  //     loadData();
  //   } catch (error) {
  //     console.error("Failed to update data:", error);
  //     toast.error(t("error"));
  //   }
  // };

  const handleUpdate = async (row: Row<TData>, data: Partial<TData>) => {
  if (!idField) return;

  const id = row.original[idField] as string | number;
  const updatedData = { ...data, id };

  // Save the original data in case we need to revert
  const originalData = { ...row.original };

  // Optimistically update the UI immediately (BEFORE the API call)
  setTableData((prev) =>
    prev.map((item) =>
      (item as TData)[idField] === id
        ? { ...item, ...updatedData }
        : item
    )
  );

  try {
    // Call the API in the background
    await updateData(updatedData);
    toast.success(t("updated_successfully"));
  } catch (error) {
    console.error("Failed to update data:", error);
    
    // Revert to original data on error
    setTableData((prev) =>
      prev.map((item) =>
        (item as TData)[idField] === id
          ? originalData as TData
          : item
      )
    );
    
    toast.error(t("error"));
  }
};
  const handleDeleteData = async (id: string | number) => {
    if (!deleteData || !idField) return;

    try {
      setIsLoading(true);
      await deleteData(id);
      await loadDataMemoized(); 
      toast.success(t("deleted_successfully"));
    } catch (error) {
      console.error("Failed to delete data:", error);
      toast.error(t("delete_failed"));
      // Refresh the table to ensure it's in sync
      await loadDataMemoized();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle column order change - update internal state and call callback
  const handleColumnOrderChange = (updater: any) => {
    const newOrder = typeof updater === 'function' 
      ? updater(internalColumnOrder) 
      : updater;
    
    setInternalColumnOrder(newOrder);
    onColumnOrderChange?.(newOrder);
  };

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
      columnOrder: internalColumnOrder,
    },
    globalFilterFn: globalFilterFn,
    onColumnOrderChange: handleColumnOrderChange,
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
    getPaginationRowModel: isLazyLoading ? undefined : getPaginationRowModel(),
    meta: {
      handleAdd,
      handleEdit: handleUpdate,
      handleDelete: handleDeleteData,
    },
  });
  const selectedRowCount = table.getSelectedRowModel?.().rows.length ?? 0;

  const handleLoadMore = () => {
    console.log("handleLoadMore called", { hasMore, isLoading });
    if (isLazyLoading && hasMore && !isLoading) {
      loadDataMemoized(true);
    }
  };

  const memoizedExtraFilters = useMemo(
    () => extraFilters,
    [JSON.stringify(extraFilters)]
  );

  // Memoize advancedFilters to prevent infinite loops
  const memoizedAdvancedFilters = useMemo(
    () => advancedFilters,
    [JSON.stringify(advancedFilters)]
  );

  // Track if initial load has happened
  const hasLoadedRef = useRef(false);

  // Use ref to track tableData length for lazy loading without causing re-renders
  const tableDataLengthRef = useRef(0);

  // Memoize loadData to prevent recreation on every render
  const loadDataMemoized = useCallback(
    async (isLoadingMore: boolean = false) => {
      if (!fetchData || isLoading) return;
      if (isLoadingMore && !hasMore) return;

      setIsLoading(true);
      try {
        const queryParams: ApiQueryParams = {
          page:
            isLazyLoading && isLoadingMore
              ? Math.ceil(tableDataLengthRef.current / pagination.pageSize) + 1
              : 1,
          pageSize: pagination.pageSize,
          sortBy: sorting.length > 0 ? sorting[0].id : undefined,
          sortOrder:
            sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined,
          search: globalFilter,
          ...memoizedAdvancedFilters,
          ...memoizedExtraFilters,
        };

        console.log("Fetching data with params:", queryParams);

        const response = await fetchData(queryParams);
        // Handle nested response structure
        //@ts-ignore
        const newData = Array.isArray(response.data)
          ? response.data
          : //@ts-ignore
            response.data?.data || [];
        //@ts-ignore
        let total = response.data?.totalCount || 0;

        if (isLazyLoading && isLoadingMore) {
          setTableData((prev) => {
            const updated = [...prev, ...newData];
            tableDataLengthRef.current = updated.length;
            return updated;
          });
          const newTotal = tableDataLengthRef.current;
          setHasMore(newTotal < total);
        } else {
          setTableData(newData);
          tableDataLengthRef.current = newData.length;
          setHasMore(newData.length < total);
        }

        setTotalCount(total);
        hasLoadedRef.current = true;
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error(t("error"));
      } finally {
        setIsLoading(false);
      }
    },
    [
      fetchData,
      isLoading,
      hasMore,
      isLazyLoading,
      pagination.pageSize,
      sorting,
      globalFilter,
      memoizedAdvancedFilters,
      memoizedExtraFilters,
    ]
  );

  // Track previous values to detect actual changes
  const prevDepsRef = useRef({
    sorting: JSON.stringify(sorting),
    globalFilter,
    advancedFilters: JSON.stringify(memoizedAdvancedFilters),
    extraFilters: JSON.stringify(memoizedExtraFilters),
    pageSize: pagination.pageSize,
  });

  useEffect(() => {
    const currentDeps = {
      sorting: JSON.stringify(sorting),
      globalFilter,
      advancedFilters: JSON.stringify(memoizedAdvancedFilters),
      extraFilters: JSON.stringify(memoizedExtraFilters),
      pageSize: pagination.pageSize,
    };

    // Check if any dependency actually changed
    const hasChanged = 
      prevDepsRef.current.sorting !== currentDeps.sorting ||
      prevDepsRef.current.globalFilter !== currentDeps.globalFilter ||
      prevDepsRef.current.advancedFilters !== currentDeps.advancedFilters ||
      prevDepsRef.current.extraFilters !== currentDeps.extraFilters ||
      prevDepsRef.current.pageSize !== currentDeps.pageSize;

    if (hasChanged || !hasLoadedRef.current) {
      if (!isLazyLoading || tableDataLengthRef.current === 0) {
        prevDepsRef.current = currentDeps;
        loadDataMemoized(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sorting,
    globalFilter,
    memoizedAdvancedFilters,
    memoizedExtraFilters,
    pagination.pageSize,
    isLazyLoading,
    // Note: loadDataMemoized is intentionally omitted to prevent infinite loops
    // It's stable due to useCallback with proper dependencies
  ]);

  useEffect(() => {
    if (visibleRows) {
      visibleRows(table.getRowModel().rows.map((row) => row.original));
    }
  }, [table.getRowModel().rows, visibleRows]);

  // Expose refresh function and addItem/updateItem functions to parent component
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady({
        refresh: () => loadDataMemoized(false),
        addItem: (item: TData) => {
          // Add item directly to table - clean and simple
          setTableData((prev) => [...prev, item]);
          // Don't increment totalCount - it will be updated on next fetch if needed
        },
        updateItem: (item: TData) => {
          if (!idField) return;
          const id = item[idField];
          setTableData((prev) =>
            prev.map((row) => ((row as any)[idField] === id ? item : row))
          );
        },
      });
    }
  }, [onRefreshReady, loadDataMemoized, idField]);

  // Trigger refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadDataMemoized(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

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
          {customLeftButtons}
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
        <div
          className="overflow-auto"
          style={{ height: "calc(100vh - 250px)" }}
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            const scrollPosition = target.scrollTop + target.clientHeight;
            const scrollThreshold = target.scrollHeight - 50;

            if (scrollPosition >= scrollThreshold) {
              if (isLazyLoading && !isLoading) {
                handleLoadMore();
              }
            }
          }}
        >
          <Table className="border-collapse border-spacing-0 text-right relative" style={{ width: "max-content", minWidth: "100%" }}>
            <DataTableHeader
              table={table}
              actions={showActionColumn ? actions : null}
              enableColumnReordering={enableColumnReordering}
              stickyColumnCount={stickyColumnCount}
              selectedRowCount={selectedRowCount}
              enableRowSelection={!!onRowSelectionChange}
              isPagination={isPagination}
              organizationId={organazitionId}
              entityType={entityType}
              onColumnOrderChange={onColumnOrderChange}
            />
            <DataTableBody<TData>
              columns={columns}
              table={table}
              actions={showActionColumn ? actions : null}
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
          {isLoading && (
            <div className="w-full py-4 flex justify-center">
              <DataTableLoading
                colSpan={columns.length + (showActionColumn ? 1 : 0)}
              />
            </div>
          )}
        </div>
      </div>
      {isPagination && !isLazyLoading && (
        <DataTablePaginationControls table={table} />
      )}
    </div>
  );
}

export default DataTable;
