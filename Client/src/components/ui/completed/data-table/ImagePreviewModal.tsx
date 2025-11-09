import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageName?: string;
}

export function ImagePreviewModal({
  open,
  onOpenChange,
  imageUrl,
  imageName,
}: ImagePreviewModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageName || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {t("image_preview", "תצוגה מקדימה של תמונה")}
          </DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 overflow-auto p-6">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {hasError ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <p className="text-muted-foreground mb-4">
                {t("error_loading_image", "שגיאה בטעינת התמונה")}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("close", "סגור")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={imageUrl}
                alt={imageName || t("image_preview", "תצוגה מקדימה")}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                style={{ display: isLoading ? "none" : "block" }}
              />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleOpenInNewTab}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t("open_in_new_tab", "פתח בכרטיסייה חדשה")}
          </Button>
          <Button
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t("download_image", "הורד תמונה")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

