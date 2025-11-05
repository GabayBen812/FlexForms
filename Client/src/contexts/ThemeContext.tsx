import { createContext } from "react";
import { useTheme } from "@/hooks/useTheme";

type ThemeContextType = ReturnType<typeof useTheme>;

export const ThemeContext = createContext<ThemeContextType>(
  {} as ThemeContextType
);

