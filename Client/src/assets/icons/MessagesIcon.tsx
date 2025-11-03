import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function MessagesIcon({ isActive = false }) {
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
      {/* Outer chat bubble */}
      <path
        d="M21 11.5C21 6.80558 16.9706 3 12 3C7.02944 3 3 6.80558 3 11.5C3 14.0076 4.28338 16.2481 6.3347 17.7489C6.1894 18.6511 5.76741 19.6969 5 20.5C6.5 20.3 8.5 19.6 9.9 18.9C10.5853 19.0465 11.2855 19.125 12 19.125C16.9706 19.125 21 16.1944 21 11.5Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots inside bubble */}
      <path
        d="M8 11H8.01M12 11H12.01M16 11H16.01"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MessagesIcon;
