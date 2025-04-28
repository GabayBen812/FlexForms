import { ThemeProperties } from "@/types/theme";

export const availableThemes = ["blue", "dark", "green", "red", "gray"] as const;
export type AvailableTheme = typeof availableThemes[number];

const themeMap: Record<AvailableTheme, ThemeProperties> = {
  blue: {
    accent: "#007aff",
    inactiveAccent: "#203C94",
    primary: "#203c87",
    datatableHeader: "#2B344E",
    background: "220 20% 94%",
    tabsBg: "#CFD7F4"
  },
  dark: {
    accent: "#000000",
    inactiveAccent: "#3a3a3a",
    primary: "#4d4d4d",
    datatableHeader: "#1c1c1c",
    background: "0 0% 95%",
    tabsBg: "#BFBFBF"
  },
  green: {
    accent: "#00c853",
    inactiveAccent: "#126236",
    primary: "#1a3d30",
    datatableHeader: "#1a3d30",
    background: "150 40% 95%",
    tabsBg: "#B2F2D0"
  },
  red: {
    accent: "#ff1744",
    inactiveAccent: "#80162e",
    primary: "#4a1f1f",
    datatableHeader: "#4a1f1f",
    background: "346 80% 95%",
    tabsBg: "#FFB3C0"
  },
  gray: {
    accent: "#9e9e9e",
    inactiveAccent: "#5e5e5e",
    primary: "#424242",
    datatableHeader: "#424242",
    background: "0 0% 96%",
    tabsBg: "#D6D6D6"
  },
};

export const resolveTheme = (theme?: string): ThemeProperties => {
  return themeMap[(theme as AvailableTheme) || "blue"];
};
