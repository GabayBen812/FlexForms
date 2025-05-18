import { ColumnDef } from "@tanstack/react-table";

export const selectionColumn: ColumnDef<any, any> = {
  id: "select",
  header: ({ table }) => (
    <input
      type="checkbox"
      className="w-4 h-4 border-2 border-blue-500 text-blue-600 rounded focus:ring-0"
      checked={table.getIsAllPageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
      onClick={(e) => e.stopPropagation()}
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      className="w-4 h-4 border-2 border-blue-500 text-blue-600 rounded focus:ring-0"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
      onClick={(e) => e.stopPropagation()}
    />
  ),
  size: 40,
};