import * as React from "react";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

export interface PageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  spinnerSize?: "sm" | "md" | "lg" | "xl";
  message?: string;
}

const PageLoader = React.forwardRef<HTMLDivElement, PageLoaderProps>(
  ({ className, spinnerSize = "xl", message, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-background/80 backdrop-blur-sm",
          "transition-opacity duration-200 opacity-100",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <LoadingSpinner size={spinnerSize} />
          {message && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }
);

PageLoader.displayName = "PageLoader";

export { PageLoader };

