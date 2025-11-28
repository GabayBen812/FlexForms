import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function CoursesIcon({ isActive = false, className }: { isActive?: boolean; className?: string }) {
  const { organization } = useOrganization();
  const theme = organization?.customStyles?.accentColor;
  const fill = isActive ? "var(--accent)" : resolveTheme(theme).inactiveAccent;

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill={isActive ? "var(--accent)" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10 2.5L3.75 6.25V15.625C3.75 15.9702 4.02982 16.25 4.375 16.25H5.625C5.97018 16.25 6.25 15.9702 6.25 15.625V7.5L10 5.3125L13.75 7.5V15.625C13.75 15.9702 14.0298 16.25 14.375 16.25H15.625C15.9702 16.25 16.25 15.9702 16.25 15.625V6.25L10 2.5Z"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 8.125L10 10.3125L13.75 8.125"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CoursesIcon;

