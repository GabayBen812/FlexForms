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
import { DataTableAdvancedUpdateBtn } from "./data-table-advanced-update-btn";
import { DataTableExportToExcelBtn } from "./data-table-export-to-excel-btn";
import {
  ApiQueryParams,
  DataTableProps,
  ColumnMeta,
  ExpandedContentProps,
} from "@/types/ui/data-table-types";
import { toast } from "@/hooks/use-toast";
import { AdvancedSearchModal } from "./AdvancedSearchModal";
import { DataTablePaginationControls } from "./data-table-pagination-controls";
import { DataTableLoading } from "./data-table-loading";
import { DataTableSelectionBar } from "./data-table-selection-bar";
import { DataTableBulkDeleteBtn } from "./data-table-bulk-delete-btn";
import { cn } from "@/lib/utils";
import { GetDirection } from "@/lib/i18n";

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
  showPageSizeSelector = true,
  organazitionId,
  onRefreshReady,
  refreshTrigger,
  entityType,
  onBulkDelete,
  onBulkAdvancedUpdate,
  onExportSelected,
  addButtonClassName,
  addButtonWrapperClassName,
  prependNewItems = false,
}: DataTableProps<TData> & {
  extraFilters?: Record<string, any>;
  customLeftButtons?: React.ReactNode;
}) {
  const [tableData, setTableData] = useState<TData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRTL = GetDirection();
  const [scrollShadow, setScrollShadow] = useState({
    showLeftShadow: false,
    showRightShadow: false,
  });
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);
  const [isHorizontalScrollable, setIsHorizontalScrollable] = useState(false);
  const isSyncingScrollRef = useRef(false);
  
  // Internal state for column order - persist it even if parent doesn't manage it
  // Use a ref to track column keys to prevent unnecessary recalculations
  const columnKeysRef = useRef<string>("");
  const cachedColumnOrderRef = useRef<string[]>([]);
  const defaultColumnOrder = useMemo(() => {
    const keys = columns.map((col) => (col as any).id || (col as any).accessorKey as string).join(",");
    if (columnKeysRef.current === keys && columnKeysRef.current !== "" && cachedColumnOrderRef.current.length > 0) {
      // Return cached version if keys haven't changed
      return cachedColumnOrderRef.current;
    }
    columnKeysRef.current = keys;
    const order = columns.map((col) => (col as any).id || (col as any).accessorKey as string);
    cachedColumnOrderRef.current = order;
    return order;
  }, [columns]);
  const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(
    columnOrder || defaultColumnOrder
  );
  
  // Update internal state when prop changes
  useEffect(() => {
    if (columnOrder) {
      setInternalColumnOrder(columnOrder);
    }
  }, [columnOrder]);

  // Debounce search for API calls while keeping immediate client-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalFilter);
    }, 400); // 400ms delay

    return () => clearTimeout(timer);
  }, [globalFilter]);

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

      if ((response as any)?.error) {
        throw new Error((response as any).error);
      }

      const createdItem = (response as any)?.data;
      if (!createdItem) {
        throw new Error("No data returned from create");
      }

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

      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message ||
            (error as any)?.error ||
            "Failed to create event";

      toast.error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
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
  if (!idField || !updateData) return;

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
    const response = await updateData(updatedData);
    const status = response?.status ?? 0;
    const isSuccess = status >= 200 && status < 300 && !("error" in (response ?? {}));
    if (!isSuccess) {
      const errorMessage =
        ("error" in (response ?? {}) && (response as any).error) ||
        t("error") ||
        "Failed to update";
      throw new Error(typeof errorMessage === "string" ? errorMessage : "Failed to update");
    }

    toast.success(t("updated_successfully"));
  } catch (error) {
    console.error("Failed to update data:", error);

    // Revert to original data on error
    setTableData((prev) =>
      prev.map((item) =>
        (item as TData)[idField] === id
          ? (originalData as TData)
          : item
      )
    );

    const errorMessage =
      error instanceof Error ? error.message : t("error");
    toast.error(errorMessage || t("error"));
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

  const resolvedStickyColumnCount =
    stickyColumnCount ??
    ((onRowSelectionChange ? 1 : 0) + (showActionColumn ? 1 : 0));

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
  const selectedRowModel = table.getSelectedRowModel?.();
  const selectedRowCount = selectedRowModel?.rows.length ?? 0;

  const getSelectedRowsData = useCallback(
    (): TData[] =>
      (table.getSelectedRowModel?.().rows ?? []).map(
        (row) => row.original as TData
      ),
    [table]
  );

  const handleBulkDeleteClick = useCallback(async () => {
    if (!onBulkDelete) return;
    await onBulkDelete(getSelectedRowsData());
  }, [getSelectedRowsData, onBulkDelete]);

  const handleBulkAdvancedUpdateClick = useCallback(async () => {
    if (!onBulkAdvancedUpdate) return;
    await onBulkAdvancedUpdate(getSelectedRowsData());
  }, [getSelectedRowsData, onBulkAdvancedUpdate]);

  const rowSelectionState = table.getState().rowSelection;
  const hasSelectionActions =
    !!onBulkDelete ||
    !!onBulkAdvancedUpdate ||
    !!(showAdvancedSearch || onExportSelected);

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
          search: debouncedSearch,
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
      debouncedSearch,
      memoizedAdvancedFilters,
      memoizedExtraFilters,
    ]
  );

  // Track previous values to detect actual changes
  const prevDepsRef = useRef({
    sorting: JSON.stringify(sorting),
    debouncedSearch,
    advancedFilters: JSON.stringify(memoizedAdvancedFilters),
    extraFilters: JSON.stringify(memoizedExtraFilters),
    pageSize: pagination.pageSize,
  });

  useEffect(() => {
    const currentDeps = {
      sorting: JSON.stringify(sorting),
      debouncedSearch,
      advancedFilters: JSON.stringify(memoizedAdvancedFilters),
      extraFilters: JSON.stringify(memoizedExtraFilters),
      pageSize: pagination.pageSize,
    };

    // Check if any dependency actually changed
    const hasChanged = 
      prevDepsRef.current.sorting !== currentDeps.sorting ||
      prevDepsRef.current.debouncedSearch !== currentDeps.debouncedSearch ||
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
    debouncedSearch,
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

  // Store loadDataMemoized in ref to prevent infinite loops
  const loadDataMemoizedRef = useRef(loadDataMemoized);
  useEffect(() => {
    loadDataMemoizedRef.current = loadDataMemoized;
  }, [loadDataMemoized]);

  // Expose refresh function and addItem/updateItem functions to parent component
  // Use refs to prevent infinite loops - only call when onRefreshReady changes
  const onRefreshReadyRef = useRef(onRefreshReady);
  const prevOnRefreshReadyRef = useRef(onRefreshReady);
  useEffect(() => {
    if (prevOnRefreshReadyRef.current !== onRefreshReady) {
      prevOnRefreshReadyRef.current = onRefreshReady;
    }
    onRefreshReadyRef.current = onRefreshReady;
  }, [onRefreshReady]);

  const addItemToState = useCallback(
    (item: TData) => {
      setTableData((prev) => {
        const filtered = idField
          ? prev.filter(
              (row) => (row as any)[idField] !== (item as any)[idField]
            )
          : prev;
        return prependNewItems ? [item, ...filtered] : [...filtered, item];
      });
    },
    [idField, prependNewItems]
  );

  // Only call onRefreshReady when it actually changes, not when loadDataMemoized changes
  const hasCalledOnRefreshReadyRef = useRef(false);
  useEffect(() => {
    if (onRefreshReadyRef.current && !hasCalledOnRefreshReadyRef.current) {
      hasCalledOnRefreshReadyRef.current = true;
      onRefreshReadyRef.current({
        refresh: () => {
          loadDataMemoizedRef.current(false);
        },
        addItem: (item: TData) => {
          addItemToState(item);
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
    } else if (onRefreshReadyRef.current && prevOnRefreshReadyRef.current !== onRefreshReady) {
      onRefreshReadyRef.current({
        refresh: () => {
          loadDataMemoizedRef.current(false);
        },
        addItem: (item: TData) => {
          addItemToState(item);
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
  }, [onRefreshReady, idField, prependNewItems, addItemToState]); // Removed loadDataMemoized from dependencies

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

  const updateScrollShadow = useCallback(
    (target?: HTMLElement) => {
      const container = target ?? scrollContainerRef.current;
      if (!container) {
        return;
      }

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) {
        setScrollShadow({
          showLeftShadow: false,
          showRightShadow: false,
        });
        return;
      }

      const threshold = 4;
      const distanceFromStart = Math.abs(container.scrollLeft);
      const isPastStart = distanceFromStart > threshold;
      const isBeforeEnd = distanceFromStart < maxScroll - threshold;

      setScrollShadow({
        showLeftShadow: isRTL ? isBeforeEnd : isPastStart,
        showRightShadow: isRTL ? isPastStart : isBeforeEnd,
      });
    },
    [isRTL],
  );

  const updateScrollMetrics = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    setScrollContentWidth(container.scrollWidth);
    setIsHorizontalScrollable(container.scrollWidth - container.clientWidth > 2);
    updateScrollShadow(container);
  }, [updateScrollShadow]);

  useEffect(() => {
    updateScrollMetrics();
  }, [tableData, internalColumnOrder, updateScrollMetrics]);

  // Calculate column widths based on content
  useEffect(() => {
    if (!tableData.length) return;

    const calculateColumnWidths = () => {
      const columnWidths = new Map<string, number>();
      
      // Get all visible columns
      const visibleColumns = table.getVisibleFlatColumns();
      
      // Initialize with header widths
      visibleColumns.forEach((column) => {
        const header = column.columnDef.header;
        const headerText = typeof header === 'string' ? header : '';
        // Estimate header width (rough calculation: ~8px per character for Hebrew)
        const headerWidth = headerText.length * 10 + 40; // Add padding
        columnWidths.set(column.id, headerWidth);
      });

      // Calculate max width for each column based on content
      tableData.forEach((row) => {
        visibleColumns.forEach((column) => {
          const accessorKey = (column.columnDef as any).accessorKey as string | undefined;
          const meta = (column.columnDef as any).meta || {};
          const isDynamic = accessorKey?.startsWith("dynamicFields.");
          
          let cellValue: any;
          if (accessorKey) {
            if (isDynamic) {
              const fieldName = accessorKey.replace("dynamicFields.", "");
              cellValue = (row as any).dynamicFields?.[fieldName];
            } else {
              cellValue = (row as any)[accessorKey];
            }
          } else {
            // For columns without accessorKey (like action columns), skip
            return;
          }

          // Calculate width based on value
          let contentWidth = 0;
          
          // Get field type - check dynamic field definition first, then meta
          const fieldDefinition = meta.fieldDefinition;
          const fieldType = isDynamic && fieldDefinition?.type 
            ? fieldDefinition.type 
            : meta.fieldType;
          const isDate = meta.isDate || fieldType === "DATE";
          const isEmailField = accessorKey === "email" || fieldType === "EMAIL";
          const isPhoneField = accessorKey === "phone" || fieldType === "PHONE";
          const isLinkField = fieldType === "LINK";
          const isMoney = fieldType === "MONEY";
          const isCheckbox = fieldType === "CHECKBOX";
          const isMultiSelect = fieldType === "MULTI_SELECT";
          
          if (cellValue != null) {
            let displayText = "";
            
            if (isDate) {
              displayText = String(cellValue).length > 0 ? "DD/MM/YYYY" : "";
            } else if (isMoney) {
              displayText = cellValue ? `₪${parseFloat(String(cellValue)).toLocaleString("he-IL")}` : "";
            } else if (isCheckbox) {
              displayText = "✓";
            } else if (isMultiSelect && Array.isArray(cellValue)) {
              displayText = cellValue.join(", ");
            } else if (isPhoneField && cellValue) {
              // Phone numbers are formatted, estimate width
              const phoneStr = String(cellValue);
              displayText = phoneStr.replace(/\D/g, '').length <= 10 ? "050-123-4567" : phoneStr;
            } else if (isLinkField && cellValue) {
              displayText = String(cellValue);
            } else if (typeof cellValue === "object" && cellValue !== null && !Array.isArray(cellValue)) {
              displayText = (cellValue as any).name || (cellValue as any).email || (cellValue as any)._id || JSON.stringify(cellValue);
            } else {
              displayText = String(cellValue);
            }
            
            // Calculate width: ~8px per character for Hebrew, add padding and icons
            const textWidth = displayText.length * 8;
            const padding = 40; // Cell padding
            const iconWidth = (isEmailField || isPhoneField || isLinkField) ? 30 : 0; // Icon width if present
            contentWidth = Math.max(textWidth + padding + iconWidth, 120); // Minimum width for content
          } else {
            // Empty cell - minimum width
            contentWidth = 100;
          }
          
          // Update max width for this column
          const currentMax = columnWidths.get(column.id) || 0;
          if (contentWidth > currentMax) {
            columnWidths.set(column.id, contentWidth);
          }
        });
      });

      // Apply calculated widths to columns
      // Note: Column sizing in TanStack Table is managed through column definitions,
      // not through a setSize method. The calculated widths are stored but not applied here.
      // If dynamic column sizing is needed, it should be handled through column sizing state.
      visibleColumns.forEach((column) => {
        const calculatedWidth = columnWidths.get(column.id);
        if (calculatedWidth) {
          // Set minimum and maximum widths
          const minWidth = 100;
          const maxWidth = 500; // Prevent columns from becoming too wide
          const finalWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
          
          // Store calculated width for potential future use
          // Column sizing in TanStack Table v8 is managed through column definitions
          // and column sizing state, not through a setSize method
          // TODO: Implement column sizing through proper TanStack Table API if needed
        }
      });
    };

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      calculateColumnWidths();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [tableData, table, columns]);

  useEffect(() => {
    const handleResize = () => updateScrollMetrics();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollMetrics]);

  const syncScrollPositions = useCallback(
    (source: "main" | "top") => {
      const main = scrollContainerRef.current;
      const top = topScrollRef.current;
      if (!main || !top) {
        return;
      }

      if (source === "main") {
        if (Math.abs(top.scrollLeft - main.scrollLeft) > 1) {
          isSyncingScrollRef.current = true;
          top.scrollLeft = main.scrollLeft;
        }
      } else {
        if (Math.abs(main.scrollLeft - top.scrollLeft) > 1) {
          isSyncingScrollRef.current = true;
          main.scrollLeft = top.scrollLeft;
        }
      }
    },
    [],
  );

  const handleTopScroll = useCallback(() => {
    if (isSyncingScrollRef.current) {
      isSyncingScrollRef.current = false;
      return;
    }
    syncScrollPositions("top");
  }, [syncScrollPositions]);

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
            onAdvancedSearchChange={onAdvancedSearchChange}
            initialAdvancedFilters={initialAdvancedFilters}
            onOpenChange={setIsAdvancedOpen}
          />
          {customLeftButtons}
        </div>
        <div className={cn("flex items-center gap-4", addButtonWrapperClassName)}>
          {customAddButton || (
            <DataTableAddButton
              showAddButton={showAdd}
              columns={columns}
              onAdd={handleAdd}
              excludeFields={excludeFields}
              buttonClassName={addButtonClassName}
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

      <div className="relative rounded-lg border border-border bg-white shadow-sm">
        {isHorizontalScrollable && (
          <div
            ref={topScrollRef}
            className="mb-2 h-4 w-full overflow-x-auto rounded-md border border-dashed border-border/80 bg-muted/40 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            onScroll={handleTopScroll}
          >
            <div style={{ width: scrollContentWidth || "100%", height: 1 }} />
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className={cn(
            "data-table-scroll-container overflow-auto rounded-lg",
            "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          )}
          style={{ height: "calc(100vh - 250px)" }}
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            if (isSyncingScrollRef.current) {
              isSyncingScrollRef.current = false;
            } else {
              syncScrollPositions("main");
            }
            updateScrollShadow(target);
            const scrollPosition = target.scrollTop + target.clientHeight;
            const scrollThreshold = target.scrollHeight - 50;

            if (scrollPosition >= scrollThreshold) {
              if (isLazyLoading && !isLoading) {
                handleLoadMore();
              }
            }
          }}
        >
          <Table className="border-collapse border-spacing-0 text-right relative min-w-full" style={{ width: "max-content", minWidth: "100%" }}>
            <DataTableHeader
              table={table}
              actions={showActionColumn ? actions : null}
              enableColumnReordering={enableColumnReordering}
              stickyColumnCount={resolvedStickyColumnCount}
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
              stickyColumnCount={resolvedStickyColumnCount}
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
        {scrollShadow.showRightShadow && (
          <div
            className="pointer-events-none absolute top-4 bottom-4 right-2 w-8 rounded-2xl bg-gradient-to-l from-white via-white/70 to-transparent dark:from-slate-900 dark:via-slate-900/70 transition-opacity duration-200"
            aria-hidden="true"
          />
        )}
        {scrollShadow.showLeftShadow && (
          <div
            className="pointer-events-none absolute top-4 bottom-4 left-2 w-8 rounded-2xl bg-gradient-to-r from-white via-white/70 to-transparent dark:from-slate-900 dark:via-slate-900/70 transition-opacity duration-200"
            aria-hidden="true"
          />
        )}
      </div>
      {isPagination && !isLazyLoading && (
        <DataTablePaginationControls 
          table={table} 
          isPagination={isPagination}
          showPageSizeSelector={showPageSizeSelector}
        />
      )}
      {hasSelectionActions && (
        <DataTableSelectionBar selectedRowCount={selectedRowCount}>
          <div className="flex w-full flex-wrap items-center justify-center gap-3">
            {onBulkDelete && (
              <DataTableBulkDeleteBtn onClick={handleBulkDeleteClick} />
            )}
            {onBulkAdvancedUpdate && (
              <DataTableAdvancedUpdateBtn
                onClick={handleBulkAdvancedUpdateClick}
              />
            )}
            {(showAdvancedSearch || onExportSelected) && (
              <DataTableExportToExcelBtn
                showAdvancedSearch={showAdvancedSearch || !!onExportSelected}
                rowSelection={rowSelectionState}
                table={table}
                onExport={
                  onExportSelected
                    ? async ({ selectedRows, table: exportTable }) => {
                        await onExportSelected(selectedRows, exportTable);
                      }
                    : undefined
                }
              />
            )}
          </div>
        </DataTableSelectionBar>
      )}
    </div>
  );
}

export default DataTable;
