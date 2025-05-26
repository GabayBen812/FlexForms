import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function PaymentsIcon({ isActive = false }) {
  const { organization } = useOrganization();
  const theme = organization?.customStyles?.accentColor;
  const fill = isActive ? "var(--accent)" : resolveTheme(theme).inactiveAccent;

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={isActive ? "var(--accent)" : "none"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 5C3 4.44772 3.44772 4 4 4H20C20.5523 4 21 4.44772 21 5V7C21 7.55228 20.5523 8 20 8H4C3.44772 8 3 7.55228 3 7V5Z"
        stroke={fill}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 11H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V11Z"
        stroke={fill}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 16H17"
        stroke={isActive ? "white" : fill}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default PaymentsIcon;
