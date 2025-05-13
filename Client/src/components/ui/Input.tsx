import * as React from "react";
import { cn } from "../../lib/utils";
import { Label } from "./label";
interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode; // Icon as a ReactNode
  iconEnd?: React.ReactNode; // Icon as a ReactNode
  label?: string | React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconEnd, ...props }, ref) => {
    return (
      <div
        className={cn("relative flex flex-col items-center gap-2", className)}
      >
        {icon && (
          <div className="absolute rtl:right-3 ltr:left-3 bottom-[10px] child:size-5 ">
            {icon}
          </div>
        )}
        {iconEnd && (
          <div className="absolute ltr:right-3 rtl:left-3 bottom-2 child:size-5 ">
            {iconEnd}
          </div>
        )}

        {props.label && (
          <div className="w-full rtl:text-right ltr:text-left">
            <Label htmlFor={String(props.label)}>{props.label}</Label>
          </div>
        )}
        <input
          type={type}
          className={cn(
            "bg-white border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left w-full focus:outline-border outline-none px-3 py-2",
            icon && "rtl:pr-10 ltr:pl-10",
            iconEnd && "ltr:pr-10 rtl:pl-10",
            className
          )}
          id={String(props.label)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
