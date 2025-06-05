export const StatCard = ({
  count,
  percent,
  label,
  color,
  fontSize = 20,
}: {
  count: number;
  percent: string;
  label: string;
  color: "orange" | "green" | "red";
  fontSize?: number;
}) => {
  const bgMap = {
    orange: "bg-orange-100/50 border-orange-500",
    green: "bg-green-100/50 border-green-500",
    red: "bg-red-100/50 border-red-500",
  };

  return (
    <div
      className={`border-2 ${bgMap[color]} rounded-full shadow w-32 h-32 flex flex-col items-center justify-center`}
    >
      <span style={{ fontSize }} className="font-bold text-black text-center">
        {count} / {percent}
      </span>
      <h6 className="text-gray-600 text-center text-sm">{label}</h6>
    </div>
  );
};
