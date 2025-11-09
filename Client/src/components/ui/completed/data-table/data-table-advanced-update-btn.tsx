import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableAdvancedUpdateBtnProps {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DataTableAdvancedUpdateBtn({
  disabled,
  onClick,
  className,
}: DataTableAdvancedUpdateBtnProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white",
        "border-transparent bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 shadow-lg shadow-orange-200/40",
        "hover:-translate-y-0.5 hover:from-orange-500 hover:via-amber-500 hover:to-pink-600 hover:text-white hover:shadow-xl hover:shadow-orange-200/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2",
        "transition-transform duration-200 ease-out",
        "disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:bg-none disabled:text-gray-500 disabled:shadow-none",
        className
      )}
    >
      <RefreshCw className="h-4 w-4" />
      {t("advanced_update", "עדכון מתקדם")}
    </Button>
  );
}

export default DataTableAdvancedUpdateBtn;

