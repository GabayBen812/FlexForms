function RoomsIcon({ isActive = false }) {
  if (isActive)
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.5 3C2.5 1.61929 3.61929 0.5 5 0.5H15C16.3807 0.5 17.5 1.61929 17.5 3V17C17.5 18.3807 16.3807 19.5 15 19.5H5C3.61929 19.5 2.5 18.3807 2.5 17V3ZM5 2.5C4.44772 2.5 4 2.94772 4 3.5V16.5C4 17.0523 4.44772 17.5 5 17.5H15C15.5523 17.5 16 17.0523 16 16.5V3.5C16 2.94772 15.5523 2.5 15 2.5H5ZM7 6.5H13V8H7V6.5ZM7 10H13V11.5H7V10Z"
          fill="#4E99FF"
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
      <rect
        x="2.5"
        y="0.5"
        width="15"
        height="19"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="7"
        y1="7"
        x2="13"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="10.5"
        x2="13"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default RoomsIcon;
