import { Button } from "@/components/ui/button";
import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps<T> {
  table: Table<T>;
}

export default function Pagination<T>({ table }: PaginationProps<T>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5; // Adjust how many numbers to show

    if (pageCount <= maxVisiblePages) {
      return Array.from({ length: pageCount }, (_, i) => i);
    }

    pages.push(0); // Always show first page

    if (pageIndex > 2) {
      pages.push("...");
    }

    const start = Math.max(1, pageIndex - 1);
    const end = Math.min(pageIndex + 1, pageCount - 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (pageIndex < pageCount - 3) {
      pages.push("...");
    }

    pages.push(pageCount - 1); // Always show last page

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 px-4">
      <Button
        variant="ghost"
        size="icon"
        disabled={!table.getCanPreviousPage()}
        onClick={() => table.previousPage()}
        className="hover:bg-none! hover:text-white text-gray-400"
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180 ltr:rotate-0" />
      </Button>

      {generatePageNumbers().map((page, index) => (
        <Button
          key={index}
          variant={"ghost"}
          size="sm"
          onClick={() => typeof page === "number" && table.setPageIndex(page)}
          disabled={page === "..."}
          className={`${
            page === pageIndex ? "text-white" : "text-gray-400"
          } hover:bg-none! hover:text-white`}
        >
          {typeof page === "number" ? page + 1 : "..."}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="icon"
        disabled={!table.getCanNextPage()}
        onClick={() => table.nextPage()}
        className="hover:bg-none! hover:text-white text-gray-400"
      >
        <ChevronRight className="w-4 h-4 rtl:rotate-180 ltr:rotate-0" />
      </Button>
    </div>
  );
}
