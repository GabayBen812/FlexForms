import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function HomeIcon({ isActive = false }) {
  const { organization } = useOrganization();
  const theme = organization?.customStyles?.accentColor;
  const fill = isActive ? "var(--accent)" : resolveTheme(theme).inactiveAccent;

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 19 18"
      fill={isActive ? "var(--accent)" : "none"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 14.2462H12M8.83283 1.06346L2.08283 6.28591C1.71524 6.57031 1.5 7.00919 1.5 7.47432V15.7481C1.5 16.5776 2.17157 17.25 3 17.25H16.5C17.3284 17.25 18 16.5776 18 15.7481V7.47432C18 7.00919 17.7848 6.57031 17.4172 6.28591L10.6672 1.06347C10.127 0.645512 9.37303 0.645511 8.83283 1.06346Z"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>



  );
}


export default HomeIcon;
