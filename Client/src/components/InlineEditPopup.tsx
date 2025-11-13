import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FieldType } from "@/types/ui/data-table-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

export const InlineEditPopup = ({
  value,
  fieldType,
  choices,
  position,
  onSave,
  onClose,
  onFileUpload,
  options,
}: {
  value: any;
  fieldType: FieldType;
  options?: { label: string; value: any }[];
  choices?: string[];
  position: { x: number; y: number };
  onSave: (newValue: any) => void;
  onClose: () => void;
  onFileUpload?: (file: File) => Promise<void>;
}) => {
  const [editValue, setEditValue] = useState(value);
    const { t } = useTranslation();
  const [dateValue, setDateValue] = useState<Date | undefined>(
    value ? parseISO(value) : undefined
  );

  useEffect(() => {
    setEditValue(value);
    if (fieldType === "DATE" && value) {
      setDateValue(parseISO(value));
    }
  }, [value, fieldType]);

  const handleSave = () => {
    console.log("Saving value:", editValue);
    if (fieldType === "DATE" && dateValue) {
      onSave(dateValue.toISOString());
    } else {
      onSave(editValue);
    }
    onClose();
  };

  return (
    <div 
      className="absolute z-50 bg-background p-4 rounded-lg shadow-lg border"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 0)'
      }}
    >
      <div className="flex flex-col gap-2">
        {fieldType === "TEXT" && (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
          />
        )}

        {fieldType === "SELECT" && options && (
          <div className="flex flex-col gap-1">
             {options.map(({ label, value: optValue }) => (
            <Button
              key={optValue}
              variant={editValue === optValue ? "default" : "outline"}
              onClick={() => setEditValue(optValue)}
            >
              {label}
            </Button>
            ))}
          </div>
        )}

        {fieldType === "DATE" && (
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={setDateValue}
          />
        )}

        {fieldType === "FILE" && (
          <Input
            type="file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file && onFileUpload) {
                await onFileUpload(file);
                onClose();
              }
            }}
          />
        )}

        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
        <Button onClick={() => {
            console.log("Save button clicked");
            handleSave();
            }}>{t("save")}</Button>
        </div>
      </div>
    </div>
  );
};