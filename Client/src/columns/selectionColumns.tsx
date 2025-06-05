import { ColumnDef } from "@tanstack/react-table";

export const selectionColumn: ColumnDef<any, any> = {
  id: "select",
  header: ({ table }) => {
    const selectedCount = table.getSelectedRowModel().rows.length;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <input
          type="checkbox"
          className="w-4 h-4 border-2 border-blue-500 text-blue-600 rounded focus:ring-0"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
        <span style={{ fontSize: 12, marginTop: 2 }}>
          נבחרו {selectedCount}
        </span>
      </div>
    );
  },
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
