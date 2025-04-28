import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import GlobeIcon from "@/assets/icons/GlobeIcon";
import { languages } from "@/i18n/languages";
import { LanguagesIcon } from "lucide-react";

function LanguagePicker({
  selectedLanguages,
  setSelectedLanguages,
}: {
  selectedLanguages?: string[];
  setSelectedLanguages?: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { i18n, t } = useTranslation();
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={selectedLanguages ? "icon" : "lg"}
          className="data-[state=open]:bg-muted outline-none border-none !ring-transparent data-[state=open]:text-sidebar-accent-foreground w-fit flex rtl:flex-row-reverse ltr:flex-row"
          variant={"ghost"}
        >
          {selectedLanguages ? (
            <LanguagesIcon />
          ) : (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {languages.find((l) => l.code === i18n.language)?.name}
                </span>
              </div>
              <GlobeIcon />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-40 rounded-lg"
        align={"center"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
            <div className="grid flex-1 rtl:text-right ltr:text-left text-sm leading-tight">
              <span className="truncate font-semibold">{t("languages")}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {languages.map(
            (language) =>
              (!selectedLanguages ||
                !selectedLanguages.includes(language.code)) && (
                <DropdownMenuItem
                  key={language.name}
                  onClick={() =>
                    setSelectedLanguages && selectedLanguages
                      ? setSelectedLanguages([
                          ...selectedLanguages,
                          language.code,
                        ])
                      : changeLanguage(language.code)
                  }
                >
                  <div className="flex items-center gap-2  rtl:flex-row ltr:flex-row-reverse">
                    <span>{language.name}</span>
                    <span className="w-5">{language.flag}</span>
                  </div>
                </DropdownMenuItem>
              )
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguagePicker;
