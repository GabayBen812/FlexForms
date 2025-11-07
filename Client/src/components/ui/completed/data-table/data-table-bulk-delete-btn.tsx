import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableBulkDeleteBtnProps {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DataTableBulkDeleteBtn({
  disabled,
  onClick,
  className,
}: DataTableBulkDeleteBtnProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 bg-red-500 text-white",
        "hover:bg-red-600 hover:text-white border-red-500 hover:border-red-600",
        "shadow-md hover:shadow-lg transition-all duration-200 font-medium",
        "disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500",
        "disabled:shadow-none disabled:cursor-not-allowed",
        className
      )}
    >
      <Trash2 className="h-4 w-4" />
      מחק נבחרים
    </Button>
  );
}

export default DataTableBulkDeleteBtn;

