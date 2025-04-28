import { GetDirection } from "@/lib/i18n";
import { TableCell, TableRow } from "../../table";

export const DataTableLoading = ({ colSpan }: { colSpan: number }) => {
  const skeletonRows = Array.from({ length: 7 });
  const skeletonColumns = Array.from({ length: colSpan });
  const direction = GetDirection();
  const firstColumnRounding = direction ? "rounded-r-lg" : "rounded-l-lg";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";
  return (
    <>
      {skeletonRows.map((_, rowIndex) => (
        <TableRow
          key={`skeleton-row-${rowIndex}`}
          className="border-b-4 border-background group cursor-pointer transition-colors h-[3.75rem]"
        >
          {skeletonColumns.map((_, colIndex) => (
            <TableCell
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              className={`bg-white animate-pulse text-primary text-base font-normal border-b-4 border-background w-auto whitespace-nowrap transition-colors group-hover:bg-muted pointer-events-none ${
                colIndex === 0 ? firstColumnRounding : "rounded-b-[1px]"
              } ${colIndex === colSpan - 1 && lastColumnRounding}`}
            >
              {colIndex !== colSpan - 1 && (
                <div className="w-20 h-4 bg-gray-200 animate-pulse rounded-md" />
              )}
              {colIndex === colSpan - 1 && (
                <div className="w-full flex justify-end">
                  <div className="w-8 h-4 bg-gray-200 animate-pulse rounded-md ml-4" />
                </div>
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
