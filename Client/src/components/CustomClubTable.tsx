import React from "react";
import { flexRender } from "@tanstack/react-table";

export default function CustomClubTable({
  columns,
  table ,
  data,
  rowSelection,
  onRowSelectionChange,
  onEditCell,
  editingCell,
  setEditingCell,
}) {
 return (
    <table className="min-w-full table-fixed border border-gray-300">
      <thead className="bg-gray-100 sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="px-4 py-3 text-left border-b border-gray-300 font-bold bg-white"
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="even:bg-gray-50">
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta;
              const isEditable = meta?.editable;
              const value = cell.getValue();

              return (
                <td
                  key={cell.id}
                   className={`px-2 py-1 border-b border-gray-200 cursor-pointer ${meta?.className || ''}`}
                  onClick={(e) => {
                    if (!isEditable) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setEditingCell({
                      rowIndex: row.index,
                      columnId: cell.column.id,
                      value,
                      fieldType: meta?.fieldType,
                      options: meta?.options,
                      rowData: row.original,
                      position: { x: rect.left + rect.width / 2, y: rect.bottom },
                      table,
                    });
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}