import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Row, ColumnDef } from "@tanstack/react-table";
import { ExpandedContentProps, TableAction } from "@/types/ui/data-table-types";

interface RowComponentProps<T> {
  row?: Row<T>;
  actions?: TableAction<T>[] | null;
  renderExpandedContent?: (props: ExpandedContentProps<T>) => React.ReactNode;
  isExpanded: boolean;
  columns: ColumnDef<T, ColumnDef<T>>[];
  onBackdropClick?: () => void;
  handleSave?: (newData: Partial<T>) => void;
  handleEdit?: (row: Partial<T>) => void;
}

function DataTableBodyRowExpanded<T>({
  isExpanded,
  row,
  actions,
  renderExpandedContent,
  columns,
  onBackdropClick,
  handleSave,
  handleEdit,
}: RowComponentProps<T>) {
  const colSpan = columns.length + (actions ? 1 : 0);
  const rowData: T | undefined =
    row?.original ??
    (Object.fromEntries(columns.map((col) => [col.id, ""])) as T);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div
            key={`backdrop-${row?.id ?? "custom"}`}
            className="fixed inset-0 bg-background/60 z-40"
            onClick={() => {
              if (row) row.toggleExpanded();
              else if (onBackdropClick) onBackdropClick();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isExpanded && renderExpandedContent && (
          <tr className="relative">
            <td colSpan={colSpan}>
              <motion.div
                key={`expanded-${row?.id ?? "custom"}`}
                className="w-full bg-white rounded-lg absolute z-40 shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                <>
                  {renderExpandedContent({
                    rowData,
                    handleSave,
                    handleEdit,
                  })}
                </>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default DataTableBodyRowExpanded;
