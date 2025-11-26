import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DataTablePageLayoutProps {
  title?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidthClassName?: string;
}

export function DataTablePageLayout({
  title,
  header,
  children,
  className,
  contentClassName,
  maxWidthClassName,
}: DataTablePageLayoutProps) {
  const headerContent =
    header ??
    (title ? (
      typeof title === "string" || typeof title === "number" ? (
        <h1 className="text-center text-2xl font-semibold text-primary">
          {title}
        </h1>
      ) : (
        title
      )
    ) : null);

  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center px-4 py-8",
        className,
      )}
    >
      <div
        className={cn(
          "w-full max-w-[110rem] space-y-6",
          maxWidthClassName,
          contentClassName,
        )}
      >
        {headerContent}
        {children}
      </div>
    </div>
  );
}

export default DataTablePageLayout;

