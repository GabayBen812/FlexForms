import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export const PRESET_COLORS = [
  { value: "#FFFFFF", label: "White", className: "bg-white" },
  { value: "#F3F4F6", label: "Light Gray", className: "bg-gray-100" },
  { value: "#EFF6FF", label: "Light Blue", className: "bg-blue-50" },
  { value: "#F0FDF4", label: "Light Green", className: "bg-green-50" },
  { value: "#FAF5FF", label: "Light Purple", className: "bg-purple-50" },
  { value: "#FDF2F8", label: "Light Pink", className: "bg-pink-50" },
  { value: "#FEFCE8", label: "Light Yellow", className: "bg-yellow-50" },
  { value: "#FFF7ED", label: "Light Orange", className: "bg-orange-50" },
  { value: "#F0FDFA", label: "Light Teal", className: "bg-teal-50" },
  { value: "#EEF2FF", label: "Light Indigo", className: "bg-indigo-50" },
] as const;

interface FormBackgroundColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => Promise<void>;
  isLoading?: boolean;
}

export default function FormBackgroundColorPicker({
  currentColor,
  onColorChange,
  isLoading = false,
}: FormBackgroundColorPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedColor = currentColor || PRESET_COLORS[0].value;
  const selectedColorInfo = PRESET_COLORS.find(
    (c) => c.value === selectedColor
  ) || PRESET_COLORS[0];

  const handleColorSelect = async (color: string) => {
    if (color === selectedColor) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      await onColorChange(color);
      setOpen(false);
      toast({
        title: t("background_color_updated") || "Background color updated",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: t("error_updating_color") || "Error updating color",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-10"
          disabled={isLoading || saving}
        >
          <Palette className="w-4 h-4" />
          <span className="hidden sm:inline">
            {t("background_color") || "Background Color"}
          </span>
          <div
            className={cn(
              "w-5 h-5 rounded border-2 border-border",
              selectedColorInfo.className
            )}
            style={{
              backgroundColor: selectedColor,
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">
            {t("select_background_color") || "Select Background Color"}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => {
              const isSelected = color.value === selectedColor;
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleColorSelect(color.value)}
                  disabled={saving}
                  className={cn(
                    "relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md",
                    color.className,
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-border hover:border-primary/50",
                    saving && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    backgroundColor: color.value,
                  }}
                  title={color.label}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary drop-shadow-sm" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {selectedColorInfo.label}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}



