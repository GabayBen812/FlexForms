import { flexRender, Table } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, Pencil, Check, X, GripVertical } from "lucide-react";
import { GetDirection } from "@/lib/i18n";
import { TableAction } from "@/types/ui/data-table-types";
import Pagination from "./Pagination";
import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePaginationControls } from "./data-table-pagination-controls";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTableFieldDefinitions, updateTableFieldDefinitions } from "@/api/organizations";
import { toast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * EditableHeader component for dynamic field labels
 * Allows inline editing of dynamic field column headers
 * Similar pattern to EditableCell component in data-table-body.tsx
 */
interface EditableHeaderProps {
  currentLabel: string;
  fieldName: string;
  organizationId: string;
  entityType: string;
}

function EditableHeader({
  currentLabel,
  fieldName,
  organizationId,
  entityType,
}: EditableHeaderProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  // React Query mutation for updating dynamic field label
  const updateMutation = useMutation({
    mutationFn: async (newLabel: string) => {
      const res = await fetchTableFieldDefinitions(organizationId);
      const definitions = {
        ...res.data,
        [entityType]: {
          ...res.data?.[entityType],
          fields: {
            ...res.data?.[entityType]?.fields,
            [fieldName]: {
              ...res.data?.[entityType]?.fields?.[fieldName],
              label: newLabel,
            },
          },
        },
      };
      return updateTableFieldDefinitions(organizationId, definitions);
    },
    onSuccess: () => {
      // Automatically invalidate and refetch organization data
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success(t("saved_successfully") || "Label updated");
      setIsEditing(false);
    },
    onError: () => {
      toast.error(t("error") || "Failed to update");
    },
  });

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Editing mode: show input with save/cancel buttons
  if (isEditing) {
    return (
      <div
        className="flex items-center gap-1 justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              updateMutation.mutate(label.trim());
            } else if (e.key === "Escape") {
              e.preventDefault();
              setLabel(currentLabel);
              setIsEditing(false);
            }
          }}
          className="text-center bg-white text-gray-900 px-2 py-1 rounded border min-w-[100px] max-w-[200px] text-sm"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateMutation.mutate(label.trim());
          }}
          disabled={updateMutation.isPending}
          className="p-1 hover:bg-gray-100/20 rounded transition-colors"
          title={t("save") || "Save"}
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLabel(currentLabel);
            setIsEditing(false);
          }}
          className="p-1 hover:bg-gray-100/20 rounded transition-colors"
          title={t("cancel") || "Cancel"}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Display mode: show label with pencil icon on hover
  return (
    <div
      className="flex items-center gap-1 group/header hover:bg-gray-100/10 rounded px-1 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      <span>{currentLabel}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
    </div>
  );
}

/**
 * DraggableHeaderCell component for dynamic field headers
 * Makes only dynamic fields draggable using @dnd-kit
 */
interface DraggableHeaderCellProps {
  header: any;
  isDynamic: boolean;
  columnId: string;
  stickyStyles?: React.CSSProperties;
  renderHeaderContent: (header: any) => React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  direction: boolean;
  className?: string;
}

function DraggableHeaderCell({
  header,
  isDynamic,
  columnId,
  stickyStyles,
  renderHeaderContent,
  isFirst,
  isLast,
  direction,
  className = "",
}: DraggableHeaderCellProps) {
  const [isHovering, setIsHovering] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnId,
    disabled: !isDynamic, // Only enable dragging for dynamic fields
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
    ...stickyStyles,
  };

  return (
    <TableHead
      ref={isDynamic ? setNodeRef : undefined}
      className={`bg-primary-foreground text-white text-center ${className} ${
        isFirst && direction
          ? "rounded-r-lg"
          : isFirst && !direction
          ? "rounded-l-lg"
          : ""
      } ${
        isLast && direction
          ? "rounded-l-lg"
          : isLast && !direction
          ? "rounded-r-lg"
          : ""
      } ${
        isDragging 
          ? "cursor-grabbing shadow-lg border-2 border-blue-400" 
          : isDynamic && isHovering
          ? "cursor-grab hover:bg-opacity-90 transition-all"
          : ""
      } relative select-none`}
      style={{
        width: header.getSize(),
        backgroundColor: isDragging 
          ? "hsl(224, 29.60%, 35%)" 
          : isDynamic && isHovering
          ? "hsl(224, 29.60%, 30%)"
          : "var(--datatable-header)",
        padding: "0.375rem 1rem",
        textAlign: "center",
        ...style,
      }}
      onMouseEnter={() => isDynamic && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...(isDynamic ? attributes : {})}
      {...(isDynamic && listeners ? listeners : {})}
    >
      <div className="flex items-center justify-center gap-2 h-full relative w-full">
        {isDynamic && (
          <div
            className={`flex-shrink-0 transition-opacity ${
              isHovering || isDragging ? "opacity-100" : "opacity-60"
            }`}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div 
          className={`flex-1 ${isFirst ? "px-8" : ""}`}
          onClick={(e) => {
            // Only stop propagation for actual interactive elements
            const target = e.target as HTMLElement;
            if (target.closest('input, button, .group\\/header')) {
              e.stopPropagation();
            }
          }}
          onPointerDown={(e) => {
            // Prevent drag when clicking directly on interactive content
            const target = e.target as HTMLElement;
            if (target.closest('input, button, .group\\/header, [role="button"]')) {
              e.stopPropagation();
            }
          }}
        >
          {renderHeaderContent(header)}
        </div>
      </div>
    </TableHead>
  );
}

interface DataTableHeaderProps<T> {
  table: Table<T>;
  actions?: TableAction<T>[] | null;
  enableColumnReordering?: boolean;
  onColumnOrderChange?: (newOrder: string[]) => void;
  stickyColumnCount?: number;
  selectedRowCount?: number;
  enableRowSelection?: boolean;
  isPagination?: boolean;
  organizationId?: string;
  entityType?: string;
}

function DataTableHeader<T>({
  table,
  actions,
  enableColumnReordering,
  stickyColumnCount,
  selectedRowCount,
  enableRowSelection,
  onColumnOrderChange,
  isPagination,
  organizationId,
  entityType,
}: DataTableHeaderProps<T>) {
  const direction = GetDirection();
  const firstColumnRounding = direction ? "rounded-r-lg" : "rounded-l-lg";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Ref for debouncing save operations
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mutation for saving field order automatically - NO invalidate to avoid refresh
  const saveFieldOrderMutation = useMutation({
    mutationFn: async (fieldOrder: string[]) => {
      if (!organizationId || !entityType) return;
      
      // Fetch current definitions
      const res = await fetchTableFieldDefinitions(organizationId);
      const currentDefinitions = res.data || {};
      const currentEntityDef = currentDefinitions[entityType] || { fields: {} };
      
      // Update with new order
      const updatedDefinitions = {
        ...currentDefinitions,
        [entityType]: {
          ...currentEntityDef,
          fieldOrder: fieldOrder,
        },
      };
      
      return updateTableFieldDefinitions(organizationId, updatedDefinitions);
    },
    onSuccess: () => {
      // Don't invalidate - the local table state is already updated
      // The server is updated, but we don't need to refetch
      // This prevents the annoying refresh/rerender
      // The columns will be correct on next page load or manual refresh
    },
    onError: (error) => {
      console.error("Error saving field order:", error);
      toast.error(t("error_saving_field_order") || "Failed to save field order");
      // Optionally, you could show a toast to ask user to manually refresh
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Configure drag-and-drop sensors
  // Reduced activation distance for easier dragging (like Monday.com)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Only 3px of movement needed - much easier to drag
        delay: 0, // No delay, immediate response
        tolerance: 0, // No tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper functions to detect and extract dynamic field information
  const isDynamicField = (accessorKey: string | undefined, meta: any): boolean => {
    return accessorKey?.startsWith("dynamicFields.") || meta?.isDynamic === true;
  };

  const getFieldName = (accessorKey: string): string => {
    return accessorKey.replace("dynamicFields.", "");
  };

  // Get dynamic field IDs from the table columns
  const getDynamicFieldIds = useCallback(() => {
    const allColumns = table.getAllColumns();
    return allColumns
      .filter((col) => {
        const accessorKey = (col.columnDef as any).accessorKey as string | undefined;
        const meta = (col.columnDef.meta as any) || {};
        return isDynamicField(accessorKey, meta);
      })
      .map((col) => col.id);
  }, [table]);

  // Render header content - handles both dynamic (editable) and regular headers
  const renderHeaderContent = (header: any) => {
    const accessorKey = (header.column.columnDef as any).accessorKey as string | undefined;
    const meta = header.column.columnDef.meta || {};
    const isDynamic = isDynamicField(accessorKey, meta);
    const currentLabel =
      typeof header.column.columnDef.header === "string"
        ? header.column.columnDef.header
        : String(header.column.columnDef.header || "");

    // If it's a dynamic field and we have organization info, render EditableHeader
    if (isDynamic && organizationId && entityType) {
      return (
        <EditableHeader
          currentLabel={currentLabel}
          fieldName={getFieldName(accessorKey || "")}
          organizationId={organizationId}
          entityType={entityType}
        />
      );
    }

    // Regular header with sorting support
    return (
      <div
        className={`flex flex-col justify-center items-center gap-1 ${
          header.column.getCanSort() && "cursor-pointer select-none"
        } whitespace-normal text-balance text-center`}
        onClick={header.column.getToggleSortingHandler()}
        style={{
          width: "100%",
          padding: "0.375rem 1rem",
          lineHeight: "1.3",
          maxHeight: "4em",
        }}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {header.column.getCanSort() &&
          (header.column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : header.column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" />
          ) : null)}
      </div>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentOrder = table.getState().columnOrder;
    const dynamicFieldIdsSet = new Set(getDynamicFieldIds());
    
    // Get the current order of dynamic fields from the actual displayed order
    const currentDynamicFieldOrder = currentOrder.filter(id => 
      dynamicFieldIdsSet.has(id)
    );
    
    // Find indices of dragged columns in the CURRENT displayed order
    const activeIndex = currentDynamicFieldOrder.indexOf(active.id as string);
    const overIndex = currentDynamicFieldOrder.indexOf(over.id as string);

    // Only allow reordering if both are dynamic fields
    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    // Reorder based on the CURRENT order, not the original definition order
    const reorderedDynamicFields = arrayMove(currentDynamicFieldOrder, activeIndex, overIndex);

    // Rebuild the column order: keep static columns in their positions, reorder dynamic fields
    // Find where dynamic fields start in the current order
    const firstDynamicIndex = currentOrder.findIndex((id) => 
      dynamicFieldIdsSet.has(id)
    );

    // Build new order
    const newOrder = [...currentOrder];
    
    if (firstDynamicIndex !== -1) {
      // Replace dynamic fields section with reordered version
      // Find how many dynamic fields are in the current order
      const dynamicFieldCount = currentOrder.filter(id => 
        dynamicFieldIdsSet.has(id)
      ).length;
      newOrder.splice(firstDynamicIndex, dynamicFieldCount, ...reorderedDynamicFields);
    } else {
      // If no dynamic fields in order, append them at the end
      const staticColumns = currentOrder.filter(id => !dynamicFieldIdsSet.has(id));
      newOrder.splice(0, newOrder.length, ...staticColumns, ...reorderedDynamicFields);
    }
    
    // Update column order
    table.setColumnOrder(newOrder);
    
    // Extract field names from the reordered dynamic fields (remove "dynamicFields." prefix)
    const reorderedFieldNames = reorderedDynamicFields.map(id => {
      const column = table.getAllColumns().find(col => col.id === id);
      const accessorKey = (column?.columnDef as any)?.accessorKey as string | undefined;
      if (accessorKey?.startsWith("dynamicFields.")) {
        return accessorKey.replace("dynamicFields.", "");
      }
      return null;
    }).filter((name): name is string => name !== null);
    
    // Call custom callback if provided
    if (onColumnOrderChange) {
      onColumnOrderChange(reorderedFieldNames);
    } else if (organizationId && entityType) {
      // Debounce the save - clear any pending save and set a new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce save to avoid multiple API calls during rapid dragging
      // Wait 500ms after user stops dragging before saving
      saveTimeoutRef.current = setTimeout(() => {
        saveFieldOrderMutation.mutate(reorderedFieldNames);
      }, 500);
    }
  };

  // Get dynamic field IDs for SortableContext
  const dynamicFieldIds = getDynamicFieldIds();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <TableHeader
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backgroundColor: "var(--datatable-header)",
        }}
      >
      {table.getHeaderGroups().map((headerGroup) => (
        <SortableContext
          key={headerGroup.id}
          items={dynamicFieldIds}
          strategy={horizontalListSortingStrategy}
        >
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header, index) => {
              const stickyBg = "hsl(224, 29.60%, 27.80%)";
              const effectiveStickyColumnCount = stickyColumnCount ?? 0;
              const isSticky = index < effectiveStickyColumnCount;
              const columnId = header.column.id;
              const currentIndex = table.getState().columnOrder.indexOf(columnId);
              const isFirst = index === 0;
              const lastIndex = headerGroup.headers.length - 1;
              const isLast = index === lastIndex;
              
              const accessorKey = (header.column.columnDef as any).accessorKey as string | undefined;
              const meta = header.column.columnDef.meta || {};
              const isDynamic = isDynamicField(accessorKey, meta);
              
              let stickyStyles: React.CSSProperties = {};

              if (isSticky) {
                const columnsBefore = table
                  .getVisibleFlatColumns()
                  .slice(0, index);
                const rightOffset = columnsBefore.reduce(
                  (sum, col) => sum + (col.getSize?.() ?? 0),
                  0
                );

                stickyStyles = {
                  position: "sticky",
                  right: `${rightOffset}px`,
                  zIndex: 25 - index,
                  backgroundColor: stickyBg,
                };
              }

              // Special handling for actions column - insert after select column
              if (index === 1 && actions !== null) {
                return (
                  <React.Fragment key={header.id}>
                    <TableHead
                      className={`text-white bg-primary-foreground`}
                      style={{
                        backgroundColor: "var(--datatable-header)",
                        width: "120px",
                        textAlign: "center",
                        padding: "0.375rem 1rem",
                      }}
                    >
                      פעולות
                    </TableHead>
                    <DraggableHeaderCell
                      header={header}
                      isDynamic={isDynamic}
                      columnId={columnId}
                      stickyStyles={stickyStyles}
                      renderHeaderContent={renderHeaderContent}
                      isFirst={false}
                      isLast={isLast}
                      direction={direction}
                    />
                  </React.Fragment>
                );
              }

              // Skip rendering actions column since we handle it above
              if (index === 1 && actions !== null) {
                return null;
              }

              return (
                <DraggableHeaderCell
                  key={header.id}
                  header={header}
                  isDynamic={isDynamic}
                  columnId={columnId}
                  stickyStyles={stickyStyles}
                  renderHeaderContent={renderHeaderContent}
                  isFirst={isFirst}
                  isLast={isLast}
                  direction={direction}
                />
              );
            })}
          {/* Pagination controls in header */}
          {isPagination && (
            <TableHead
              className="bg-primary-foreground text-white text-center"
              style={{
                backgroundColor: "var(--datatable-header)",
                borderTopLeftRadius: direction ? "0.5rem" : undefined,
                borderBottomLeftRadius: direction ? "0.5rem" : undefined,
                borderTopRightRadius: !direction ? "0.5rem" : undefined,
                borderBottomRightRadius: !direction ? "0.5rem" : undefined,
                padding: 0,
                width: "150px",
                maxWidth: "150px",
              }}
              colSpan={2}
            >
              <DataTablePaginationControls
                table={table}
                isPagination={isPagination}
              />
            </TableHead>
          )}
          </TableRow>
        </SortableContext>
      ))}
      </TableHeader>
    </DndContext>
  );
}

export default DataTableHeader;
