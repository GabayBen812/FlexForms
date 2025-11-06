import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SmartLoadFromExcelProps {
  /** Optional title for the dialog */
  title?: string;
  /** Optional children to render inside the dialog body */
  children?: React.ReactNode;
  /** Optional button variant */
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Optional button className */
  buttonClassName?: string;
  /** Optional button text override */
  buttonText?: string;
}

export function SmartLoadFromExcel({
  title,
  children,
  buttonVariant = "outline",
  buttonClassName,
  buttonText,
}: SmartLoadFromExcelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const defaultButtonClassName =
    "bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium";

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => setOpen(true)}
        className={buttonClassName || defaultButtonClassName}
      >
        <FileUp className="w-4 h-4 mr-2" />
        {buttonText || t("smart_load_from_excel", "טעינה חכמה מאקסל")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {title || t("smart_load_from_excel", "טעינה חכמה מאקסל")}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {children || (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  {t("dialog_content_placeholder", "Dialog content will be added here")}
                </p>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}

