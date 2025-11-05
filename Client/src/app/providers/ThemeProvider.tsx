import React, { ReactNode } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { useTheme } from "@/hooks/useTheme";

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

