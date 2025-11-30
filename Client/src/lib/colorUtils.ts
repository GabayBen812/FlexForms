const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const DEFAULT_BADGE_BG = "#E5E7EB";
export const DEFAULT_BADGE_TEXT = "#0F172A";
export const DEFAULT_DARK_TEXT = "#FFFFFF";

export function normalizeHexColor(color?: string): string | undefined {
  if (!color) return undefined;
  const trimmed = color.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return undefined;
  }

  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return trimmed.toUpperCase();
}

export function getReadableTextColor(
  backgroundColor?: string,
  lightColor = DEFAULT_BADGE_TEXT,
  darkColor = DEFAULT_DARK_TEXT
): string {
  const hex = normalizeHexColor(backgroundColor);
  if (!hex) return lightColor;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Perceived luminance formula
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140 ? lightColor : darkColor;
}

export function getBadgeColors(color?: string) {
  const background = normalizeHexColor(color) ?? DEFAULT_BADGE_BG;
  const text = getReadableTextColor(background);

  return { background, text };
}





