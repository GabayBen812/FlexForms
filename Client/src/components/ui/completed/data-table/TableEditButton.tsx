import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableEditButtonProps extends Omit<ButtonProps, "variant" | "size" | "children"> {
  iconSize?: string;
}

export function TableEditButton({ 
  iconSize = "h-4 w-4", 
  className,
  ...props 
}: TableEditButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200",
        className
      )}
      {...props}
    >
      <Pencil className={iconSize} />
    </Button>
  );
}

