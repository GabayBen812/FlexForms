import * as React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Clock, Calendar, CalendarDays } from "lucide-react";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a year is a leap year
 */
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Get the number of days in a given month and year
 */
const getDaysInMonth = (month: number, year: number): number => {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  
  return daysInMonth[month - 1] || 31;
};

/**
 * Parse an ISO date string (YYYY-MM-DD) or Date object into day/month/year
 */
const parseISODate = (
  value: string | Date | null | undefined
): { day: string; month: string; year: string } => {
  if (!value) {
    return { day: "", month: "", year: "" };
  }

  let dateObj: Date;
  
  if (value instanceof Date) {
    dateObj = value;
  } else if (typeof value === "string") {
    // Handle ISO format (YYYY-MM-DD)
    dateObj = new Date(value);
  } else {
    return { day: "", month: "", year: "" };
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return { day: "", month: "", year: "" };
  }

  const year = dateObj.getFullYear().toString();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");

  return { day, month, year };
};

/**
 * Format day, month, year into ISO format (YYYY-MM-DD)
 */
const formatToISO = (day: string, month: string, year: string): string => {
  if (!day || !month || !year) {
    return "";
  }

  const paddedMonth = month.padStart(2, "0");
  const paddedDay = day.padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
};

// ============================================================================
// Component
// ============================================================================

export interface DateInputProps extends Omit<React.ComponentProps<"div">, "value" | "onChange" | "onBlur"> {
  value?: string | Date | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  name?: string;
}

export const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
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
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "he";

    // Parse the initial value
    const parsedDate = React.useMemo(() => parseISODate(value), [value]);

    // Local state for each dropdown
    const [selectedYear, setSelectedYear] = React.useState<string>(parsedDate.year);
    const [selectedMonth, setSelectedMonth] = React.useState<string>(parsedDate.month);
    const [selectedDay, setSelectedDay] = React.useState<string>(parsedDate.day);

    // Update local state when prop value changes
    React.useEffect(() => {
      const parsed = parseISODate(value);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
    }, [value]);

    // Generate year options (current year down to 1900)
    const currentYear = new Date().getFullYear();
    const yearOptions = React.useMemo(() => {
      const years: number[] = [];
      for (let year = currentYear; year >= 1900; year--) {
        years.push(year);
      }
      return years;
    }, [currentYear]);

    // Generate month options (1-12)
    const monthOptions = React.useMemo(() => {
      return Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        return {
          value: monthNum.toString().padStart(2, "0"),
          label: monthNum.toString().padStart(2, "0"),
        };
      });
    }, []);

    // Calculate available days based on selected month and year
    const dayOptions = React.useMemo(() => {
      if (!selectedMonth || !selectedYear) {
        // Show 1-31 if month or year not selected
        return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
      }

      const maxDays = getDaysInMonth(parseInt(selectedMonth, 10), parseInt(selectedYear, 10));
      return Array.from({ length: maxDays }, (_, i) => (i + 1).toString());
    }, [selectedMonth, selectedYear]);

    // Adjust selected day if it's no longer valid (e.g., switched from Jan 31 to Feb)
    React.useEffect(() => {
      if (selectedDay && selectedMonth && selectedYear) {
        const maxDays = getDaysInMonth(parseInt(selectedMonth, 10), parseInt(selectedYear, 10));
        const currentDay = parseInt(selectedDay, 10);
        
        if (currentDay > maxDays) {
          const adjustedDay = maxDays.toString().padStart(2, "0");
          setSelectedDay(adjustedDay);
          
          // Trigger onChange with adjusted value
          const isoDate = formatToISO(adjustedDay, selectedMonth, selectedYear);
          if (isoDate) {
            onChange(isoDate);
          }
        }
      }
    }, [selectedMonth, selectedYear, selectedDay, onChange]);

    // Handle dropdown changes
    const handleYearChange = React.useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = e.target.value;
        setSelectedYear(newYear);

        // Only trigger onChange if all three values are selected
        if (newYear && selectedMonth && selectedDay) {
          const isoDate = formatToISO(selectedDay, selectedMonth, newYear);
          if (isoDate) {
            onChange(isoDate);
          }
        } else if (!newYear && !selectedMonth && !selectedDay) {
          // Clear the date if all are empty
          onChange("");
        }
      },
      [selectedMonth, selectedDay, onChange]
    );

    const handleMonthChange = React.useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = e.target.value;
        setSelectedMonth(newMonth);

        // Only trigger onChange if all three values are selected
        if (selectedYear && newMonth && selectedDay) {
          const isoDate = formatToISO(selectedDay, newMonth, selectedYear);
          if (isoDate) {
            onChange(isoDate);
          }
        } else if (!selectedYear && !newMonth && !selectedDay) {
          // Clear the date if all are empty
          onChange("");
        }
      },
      [selectedYear, selectedDay, onChange]
    );

    const handleDayChange = React.useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDay = e.target.value;
        setSelectedDay(newDay);

        // Only trigger onChange if all three values are selected
        if (selectedYear && selectedMonth && newDay) {
          const isoDate = formatToISO(newDay, selectedMonth, selectedYear);
          if (isoDate) {
            onChange(isoDate);
          }
        } else if (!selectedYear && !selectedMonth && !newDay) {
          // Clear the date if all are empty
          onChange("");
        }
      },
      [selectedYear, selectedMonth, onChange]
    );

    // Handle blur event
    const handleBlur = React.useCallback(() => {
      if (onBlur) {
        onBlur();
      }
    }, [onBlur]);

    // Common select styles - Modern design with shadows and smooth interactions
    const selectClassName = cn(
      "bg-white border border-gray-200 rounded-lg text-foreground font-medium text-center",
      "shadow-sm hover:shadow-md hover:border-gray-300",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      "transition-all duration-200 ease-in-out",
      "px-4 py-3 h-12 text-base",
      disabled && "opacity-50 cursor-not-allowed hover:shadow-sm",
      !disabled && "cursor-pointer",
      "appearance-none bg-no-repeat"
    );

    // Render dropdowns in correct order based on language direction
    const renderDropdowns = () => {
      const yearDropdown = (
        <div key="year" className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-medium text-gray-700 text-center flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-500" />
            {t("year", "Year")}
          </label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            className={cn(selectClassName, "w-full min-w-[100px]")}
            aria-label={t("year", "Year")}
          >
            <option value="" disabled className="text-gray-400">
              {t("year", "YYYY")}
            </option>
            {yearOptions.map((year) => (
              <option key={year} value={year} className="text-foreground">
                {year}
              </option>
            ))}
          </select>
        </div>
      );

      const monthDropdown = (
        <div key="month" className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-medium text-gray-700 text-center flex items-center justify-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-500" />
            {t("month", "Month")}
          </label>
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            className={cn(selectClassName, "w-full min-w-[80px]")}
            aria-label={t("month", "Month")}
          >
            <option value="" disabled className="text-gray-400">
              {t("month", "MM")}
            </option>
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value} className="text-foreground">
                {month.label}
              </option>
            ))}
          </select>
        </div>
      );

      const dayDropdown = (
        <div key="day" className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-medium text-gray-700 text-center flex items-center justify-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            {t("calendar_day", "Day")}
          </label>
          <select
            value={selectedDay}
            onChange={handleDayChange}
            onBlur={handleBlur}
            disabled={disabled || (!selectedMonth || !selectedYear)}
            required={required}
            className={cn(selectClassName, "w-full min-w-[80px]")}
            aria-label={t("calendar_day", "Day")}
          >
            <option value="" disabled className="text-gray-400">
              {t("calendar_day", "DD")}
            </option>
            {dayOptions.map((day) => (
              <option key={day} value={day.padStart(2, "0")} className="text-foreground">
                {day}
              </option>
            ))}
          </select>
        </div>
      );

      // For birthdates, standard order is Year | Month | Day (LTR)
      // For RTL (Hebrew), reverse to Day | Month | Year
      if (isRTL) {
        return [dayDropdown, monthDropdown, yearDropdown];
      } else {
        return [yearDropdown, monthDropdown, dayDropdown];
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-3 w-full items-center justify-center",
          isRTL && "flex-row-reverse",
          className
        )}
        {...props}
      >
        {renderDropdowns()}
        {/* Hidden input for form compatibility */}
        <input type="hidden" name={name} value={formatToISO(selectedDay, selectedMonth, selectedYear)} />
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
