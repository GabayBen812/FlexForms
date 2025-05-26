import { useTranslation } from "react-i18next";

const fieldTypes = [
  { type: "text", label: "טקסט חופשי" },
  { type: "select", label: "בחירה" },
  { type: "multiselect", label: "בחירה מרובה" },
  { type: "checkbox", label: "תקנון" },
  { type: "date", label: "תאריך" },
  { type: "signature", label: "חתימה דיגיטלית" },
];

export default function FieldPalette() {
  const { t } = useTranslation();

  const handleDragStart = (e: React.DragEvent, fieldType: string) => {
    e.dataTransfer.setData("field", JSON.stringify({ type: fieldType }));
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg space-y-2">
      <h2 className="font-bold text-lg">{t("fields_palette")}</h2>
      {fieldTypes.map(({ type, label }) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          className="bg-white p-2 border rounded cursor-move hover:bg-blue-50 transition"
        >
          {label}
        </div>
      ))}
    </div>
  );
}
