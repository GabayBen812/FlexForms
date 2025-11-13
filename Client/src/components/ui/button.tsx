import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-light shadow hover:shadow-md hover:brightness-110 active:scale-95 active:brightness-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow hover:shadow-md hover:brightness-110 active:scale-95 active:brightness-95",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent/50 hover:text-accent-foreground hover:shadow-md active:scale-95 active:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:brightness-110 active:scale-95 active:brightness-95",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground active:scale-95 active:bg-accent",
        link: "text-primary underline-offset-4 hover:underline active:opacity-80",
        success:
          "bg-green-600 text-white shadow hover:shadow-md hover:brightness-110 active:scale-95 active:brightness-95",
        info:
          "bg-blue-600 text-white shadow hover:shadow-md hover:brightness-110 active:scale-95 active:brightness-95",
        warning:
          "bg-amber-600 text-white shadow hover:shadow-md hover:brightness-110 active:scale-95 active:brightness-95",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  tooltip?: string; // New tooltip prop
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      tooltip,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const button = (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "cursor-not-allowed"
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Comp>
    );

    // Conditionally wrap with Tooltip if `tooltip` prop is provided
    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
