import * as React from "react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

// Helper function to convert value to YYYY-MM-DD format for input
const formatValueForInput = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  
  let date: dayjs.Dayjs | null = null;
  
  if (value instanceof Date) {
    date = dayjs(value);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      date = dayjs(trimmed);
    }
  }
  
  if (date && date.isValid()) {
    return date.format("YYYY-MM-DD");
  }
  
  return "";
};

export interface DateInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "onBlur" | "type"> {
  value?: string | Date | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  name?: string;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      disabled = false,
      required = false,
      placeholder,
      className,
      name,
      ...props
    },
    ref
  ) => {
    const inputValue = React.useMemo(() => formatValueForInput(value), [value]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        // Convert to ISO format (YYYY-MM-DD) - already in correct format from input
        onChange(newValue);
      },
      [onChange]
    );

    const handleBlur = React.useCallback(() => {
      if (onBlur) {
        onBlur();
      }
    }, [onBlur]);

    return (
      <input
        ref={ref}
        type="date"
        name={name}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={cn(
          "bg-white border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left w-full focus:outline-border outline-none px-3 py-2",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

DateInput.displayName = "DateInput";
