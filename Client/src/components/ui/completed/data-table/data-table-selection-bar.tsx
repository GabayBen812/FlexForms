import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface DataTableSelectionBarProps {
  selectedRowCount: number;
  className?: string;
}

export function DataTableSelectionBar({
  selectedRowCount,
  className,
  children,
}: PropsWithChildren<DataTableSelectionBarProps>) {
  if (selectedRowCount <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 pointer-events-none flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0)+1rem)]",
        "transition-transform duration-300 ease-out",
        className
      )}
      role="region"
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-3 rounded-t-2xl",
          "bg-white/90 backdrop-blur-md shadow-2xl border border-muted/40",
          "px-6 py-4 text-sm text-foreground transition-transform duration-300 ease-out",
          "animate-in slide-in-from-bottom-6 fade-in"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default DataTableSelectionBar;

