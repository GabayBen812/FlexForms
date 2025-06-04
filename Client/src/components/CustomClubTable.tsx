import React from "react";
import { flexRender } from "@tanstack/react-table";

export default function CustomClubTable({
  table ,
  setEditingCell,
}) {
   const stickyCount = 3;
   const stickyOffsets = table.getVisibleLeafColumns()
      .slice(0, stickyCount).reduce((acc, col, i) => {
        const prev = acc[i - 1] || 0;
        acc[i] = prev + (i > 0 ? table.getVisibleLeafColumns()[i - 1].getSize() : 0);
        return acc;
      }, []);
 return (
   <div className="relative">
    <table className="min-w-full table-fixed border border-gray-300 club-table">
      <thead className="bg-gray-300 sticky top-0 z-50">
      
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header, headerIndex) => {
              const isSticky = headerIndex < 3;
                return (
              <th
                key={header.id}
                className={`px-4 py-3 text-left ${
                      isSticky ? "sticky z-20 bg-gray-300" : ""
                    }`}
                    style={{
                      right: isSticky ? stickyOffsets[headerIndex] : "auto",
                      width: header.column.getSize(),
                    }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            );
              })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className={`${row.index % 2 === 0 ? "bg-gray-70" : "bg-white"}`}>
            {row.getVisibleCells().map((cell, cellIndex) => {
              const meta = cell.column.columnDef.meta;
              const isSticky = cellIndex < 3;
              const isEven = row.index % 2 === 0;
              const isEditable = meta?.editable;
              const value = cell.getValue();

              return (
                <td
                  key={cell.id}
                  className={`px-2 py-0 ${
                      meta?.className || ""
                    } ${isSticky ? "sticky z-10" : ""}`}
                    style={{
                      right: isSticky ? stickyOffsets[cellIndex] : "auto",
                      width: cell.column.getSize(),
                       backgroundColor: isSticky
                        ? isEven
                        ? "#e5e7eb" 
                        : "#f3f4f6"
                        : undefined,
                                }}
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
    </div>
  );
}