import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function UsersIcon({ isActive = false }) {
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
    >
      {/* Head and shoulders of main user */}
      <path
        d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Main user's body */}
      <path
        d="M4 19C4 16.2386 7.58172 14 12 14C16.4183 14 20 16.2386 20 19"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small second user head (optional for multi-user look) */}
      <path
        d="M19 8C19.5523 8 20 7.55228 20 7C20 6.44772 19.5523 6 19 6C18.4477 6 18 6.44772 18 7C18 7.55228 18.4477 8 19 8Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default UsersIcon;
