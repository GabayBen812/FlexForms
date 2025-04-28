import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function CallsIcon({ isActive = false }) {
  const { organization } = useOrganization();
  const theme = organization?.customStyles?.accentColor;
  const fill = isActive ? "var(--accent)" : resolveTheme(theme).inactiveAccent;


  return (
    <svg
      width="20"
      height="17"
      viewBox="0 0 20 17"
      fill={isActive ? "var(--accent)" : "none"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.714233 14.9288V2.07164C0.714233 1.28267 1.35383 0.643066 2.1428 0.643066H17.8571C18.6461 0.643066 19.2857 1.28265 19.2857 2.07164V14.9288C19.2857 15.7178 18.6461 16.3574 17.8571 16.3574H2.1428C1.35383 16.3574 0.714233 15.7178 0.714233 14.9288Z"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.714233 4.21436L9.18679 10.08C9.676 10.4187 10.3239 10.4187 10.8131 10.08L19.2857 4.21436"
        stroke={isActive ? "white" : fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CallsIcon;
