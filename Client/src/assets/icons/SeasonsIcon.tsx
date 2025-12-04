import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function SeasonsIcon({ isActive = false, className }: { isActive?: boolean; className?: string }) {
  const { organization } = useOrganization();
  const theme = organization?.customStyles?.accentColor;
  const stroke = isActive ? "var(--accent)" : resolveTheme(theme).inactiveAccent;

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Calendar outline */}
      <path
        d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top bar */}
      <path
        d="M16 2V6M8 2V6M3 10H21"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Calendar grid dots */}
      <circle cx="9" cy="14" r="1" fill={stroke} />
      <circle cx="12" cy="14" r="1" fill={stroke} />
      <circle cx="15" cy="14" r="1" fill={stroke} />
      <circle cx="9" cy="17" r="1" fill={stroke} />
      <circle cx="12" cy="17" r="1" fill={stroke} />
    </svg>
  );
}

export default SeasonsIcon;

