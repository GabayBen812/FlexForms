import { useEffect, useState } from "react";

/**
 * Hook to debounce text value
 * @param value - The text we want to debounce
 * @param delay - The amount of time we want to wait, with 500ms as default
 */
export const useDebounce = (value: string, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};
