import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("relative", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  className?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size, className, ...props }, ref) => {
    const sizeClasses = {
      sm: {
        container: "h-4 w-4",
        outer: "h-4 w-4 border-2",
        middle: "h-3 w-3 border-2",
        inner: "h-2 w-2 border",
        dot: "h-0.5 w-0.5",
      },
      md: {
        container: "h-8 w-8",
        outer: "h-8 w-8 border-2",
        middle: "h-6 w-6 border-2",
        inner: "h-4 w-4 border",
        dot: "h-1 w-1",
      },
      lg: {
        container: "h-12 w-12",
        outer: "h-12 w-12 border-[3px]",
        middle: "h-9 w-9 border-2",
        inner: "h-6 w-6 border-2",
        dot: "h-1.5 w-1.5",
      },
      xl: {
        container: "h-16 w-16",
        outer: "h-16 w-16 border-[3px]",
        middle: "h-12 w-12 border-2",
        inner: "h-8 w-8 border-2",
        dot: "h-2 w-2",
      },
    };

    const currentSize = size || "md";
    const sizeConfig = sizeClasses[currentSize];

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div className={cn("relative", sizeConfig.container)}>
          {/* Outer ring - fastest rotation with gradient effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              "border-t-primary border-r-primary/30 border-b-transparent border-l-transparent",
              sizeConfig.outer,
              "animate-[spin_0.5s_linear_infinite]"
            )}
            style={{
              filter: "drop-shadow(0 0 2px hsl(var(--primary) / 0.5))",
            }}
          />
          {/* Middle ring - counter-rotation */}
          <div
            className={cn(
              "absolute inset-0 m-auto rounded-full",
              "border-t-primary/80 border-r-transparent border-b-primary/20 border-l-transparent",
              sizeConfig.middle,
              "animate-[spin_0.7s_linear_infinite_reverse]"
            )}
          />
          {/* Inner ring - slower rotation */}
          <div
            className={cn(
              "absolute inset-0 m-auto rounded-full",
              "border-t-primary/60 border-r-transparent border-b-transparent border-l-primary/30",
              sizeConfig.inner,
              "animate-[spin_0.9s_linear_infinite]"
            )}
          />
          {/* Center pulsing dot with glow */}
          <div
            className={cn(
              "absolute inset-0 m-auto rounded-full bg-primary",
              sizeConfig.dot,
              "animate-[pulse_1s_ease-in-out_infinite]"
            )}
            style={{
              boxShadow: "0 0 4px hsl(var(--primary) / 0.6)",
            }}
          />
        </div>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner, spinnerVariants };

