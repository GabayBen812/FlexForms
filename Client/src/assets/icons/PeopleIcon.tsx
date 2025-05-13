import { useOrganization } from "@/hooks/useOrganization";
import { resolveTheme } from "@/lib/themeUtils";

function PeopleIcon({ isActive = false }) {
  const { organization } = useOrganization();
  const theme = organization?.customStyles?.accentColor;
  const fill = isActive ? "var(--accent)" : resolveTheme(theme).inactiveAccent;

  
  if (isActive)
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill={isActive ? "var(--accent)" : "none"}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.14286 8.57059C9.1153 8.57059 10.7143 6.97161 10.7143 4.99916C10.7143 3.02672 9.1153 1.42773 7.14286 1.42773C5.17041 1.42773 3.57143 3.02672 3.57143 4.99916C3.57143 6.97161 5.17041 8.57059 7.14286 8.57059ZM7.14286 9.99916C3.19797 9.99916 0 13.1971 0 17.142V17.8563C0 18.2507 0.319797 18.5706 0.714286 18.5706H13.5714C13.9659 18.5706 14.2857 18.2507 14.2857 17.8563V17.142C14.2857 13.1971 11.0877 9.99916 7.14286 9.99916ZM19.2857 18.5706H15.9679C16.0351 18.3443 16.0714 18.1044 16.0714 17.8563V17.142C16.0714 14.2262 14.6737 11.6368 12.5117 10.0074C12.6262 10.0019 12.7413 9.99916 12.8571 9.99916C16.802 9.99916 20 13.1971 20 17.142V17.8563C20 18.2507 19.6801 18.5706 19.2857 18.5706ZM12.8571 8.57059C12.3361 8.57059 11.8411 8.45902 11.3947 8.25845C12.0879 7.35552 12.4999 6.22546 12.4999 4.99916C12.4999 3.77286 12.0879 2.64281 11.3947 1.73988C11.8411 1.53931 12.3361 1.42773 12.8571 1.42773C14.8296 1.42773 16.4286 3.02672 16.4286 4.99916C16.4286 6.97161 14.8296 8.57059 12.8571 8.57059Z"
          fill={isActive ? "var(--accent)" : "none"}
        />
      </svg>
    );
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.428 17.857H19.2852V17.1427C19.2852 14.0834 17.148 11.5231 14.2852 10.8735"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1426 2.23284C12.3709 2.17408 12.6102 2.14282 12.8569 2.14282C14.4349 2.14282 15.714 3.42201 15.714 4.99997C15.714 6.57792 14.4349 7.85711 12.8569 7.85711C12.6102 7.85711 12.3709 7.82585 12.1426 7.76709"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.14244 10.7144C3.59204 10.7144 0.713867 13.5925 0.713867 17.1429V17.8572H13.571V17.1429C13.571 13.5925 10.6928 10.7144 7.14244 10.7144Z"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.1423 7.85711C8.72026 7.85711 9.99944 6.57792 9.99944 4.99997C9.99944 3.42201 8.72026 2.14282 7.1423 2.14282C5.56434 2.14282 4.28516 3.42201 4.28516 4.99997C4.28516 6.57792 5.56434 7.85711 7.1423 7.85711Z"
        stroke={fill}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default PeopleIcon;
