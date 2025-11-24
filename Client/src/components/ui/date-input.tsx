import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDateForDisplay, parseDateForSubmit } from "@/lib/dateUtils";

// Helper function to format value to DD/MM/YYYY for display
const formatValueForInput = (value: string | Date | null | undefined): string => {
  return formatDateForDisplay(value);
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
    // Format the prop value to DD/MM/YYYY for display
    const formattedValue = React.useMemo(() => formatValueForInput(value), [value]);
    
    // Local state to track what user is typing (allows free typing)
    const [localValue, setLocalValue] = React.useState<string>(formattedValue);
    
    // Update local value when prop value changes (from parent)
    React.useEffect(() => {
      setLocalValue(formattedValue);
    }, [formattedValue]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        
        // Try to convert from DD/MM/YYYY format to ISO format (YYYY-MM-DD) for API
        const isoDate = parseDateForSubmit(newValue);
        
        // Only call onChange if we have a valid date
        // This allows users to type freely without clearing the input
        if (isoDate) {
          onChange(isoDate);
        } else if (!newValue.trim()) {
          // Allow clearing the input
          onChange("");
        }
      },
      [onChange]
    );

    const handleBlur = React.useCallback(() => {
      // On blur, validate and normalize the date
      const isoDate = parseDateForSubmit(localValue);
      if (isoDate) {
        // Update to formatted version for consistent display
        setLocalValue(formatValueForInput(isoDate));
        onChange(isoDate);
      } else if (localValue.trim()) {
        // Invalid date - revert to formatted value from prop
        setLocalValue(formattedValue);
      }
      
      if (onBlur) {
        onBlur();
      }
    }, [localValue, formattedValue, onChange, onBlur]);

    return (
      <input
        ref={ref}
        type="text"
        name={name}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder || "DD/MM/YYYY"}
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
