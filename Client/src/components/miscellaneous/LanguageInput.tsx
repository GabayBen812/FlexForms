import { useTranslation } from "react-i18next";
import { Input } from "../ui/Input";
import IsraelFlag from "@/assets/icons/Flags/IsraelFlag";
import { languages } from "@/i18n/languages";
import { useEffect, useState } from "react";
import LanguagePicker from "../LanguagePicker";
import { MinusCircleIcon } from "lucide-react";

interface Language {
  code: string;
  name: string;
  flag?: React.ReactNode;
}

interface LanguageInputProps {
  label: string;
  onLanguageValuesChange: (values: Record<string, string>) => void;
  defaultValue?: Record<string, string>;
}

export default function LanguageInput({
  label,
  onLanguageValuesChange,
  defaultValue,
}: LanguageInputProps) {
  const { t } = useTranslation();
  const [usedLanguages, setUsedLanguages] = useState(["he"]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues((prev) => {
      const updated: Record<string, string> = { ...prev };

      usedLanguages.forEach((langCode) => {
        if (!(langCode in updated)) {
          updated[langCode] = "";
        }
      });

      return updated;
    });
  }, [usedLanguages]);

  useEffect(() => {
    if (defaultValue) {
      const langs = Object.keys(defaultValue);
      setUsedLanguages(langs.length > 0 ? langs : ["he"]);
      setValues(defaultValue);
    } else {
      setUsedLanguages(["he"]);
      setValues({ he: "" });
    }
  }, [defaultValue]);

  useEffect(() => {
    // Notify parent component about value changes
    onLanguageValuesChange(values);
  }, [values, onLanguageValuesChange]);

  const handleInputChange = (langCode: string, newValue: string) => {
    setValues((prevValues) => ({
      ...prevValues,
      [langCode]: newValue,
    }));
  };

  const handleRemoveLanguage = (langCode: string) => {
    setUsedLanguages((prev) => prev.filter((code) => code !== langCode));
    setValues((prevValues) => {
      const newValues = { ...prevValues };
      delete newValues[langCode];
      return newValues;
    });
  };

  return (
    <div className="flex flex-col gap-4 ">
      {/* Default language input */}
      <Input
        icon={
          languages.find((lang) => lang.code === "he")?.flag || <IsraelFlag />
        }
        value={values["he"] || ""}
        className="gap-1"
        onChange={(e) => handleInputChange("he", e.target.value)}
        label={label + " - " + t("required")}
        placeholder={label}
      />

      {/* Added languages inputs */}
      {languages
        .filter(
          (lang) => usedLanguages.includes(lang.code) && lang.code !== "he"
        )
        .map((lang) => (
          <Input
            key={lang.code}
            icon={lang.flag}
            value={values[lang.code] || ""}
            onChange={(e) => handleInputChange(lang.code, e.target.value)}
            label={
              <label className="w-full flex justify-between h-5 items-center">
                {label + " - " + t("translated")}
                <span>
                  <MinusCircleIcon
                    className="h-3 text-border hover:cursor-pointer"
                    onClick={() => handleRemoveLanguage(lang.code)}
                  />
                </span>
              </label>
            }
            placeholder={label}
          />
        ))}

      {/* Add language button */}
      {languages.filter(
        (lang) => usedLanguages.includes(lang.code) && lang.code !== "he"
      ).length <
        languages.length - 1 && (
        <Input
          className="border-dashed cursor-default"
          icon={
            <LanguagePicker
              selectedLanguages={usedLanguages}
              setSelectedLanguages={setUsedLanguages}
            />
          }
          label={label + " - " + t("translated")}
          placeholder={t("add_language") + "..."}
        />
      )}
    </div>
  );
}
