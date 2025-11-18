import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getInvoice } from "@/api/invoices";
import { Invoice } from "@/types/invoices/invoice";
import { useToast } from "@/hooks/use-toast";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { formatDateForDisplay } from "@/lib/dateUtils";

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}

const PDF_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

export function InvoiceModal({ open, onOpenChange, invoiceId }: InvoiceModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoice();
    } else {
      setInvoice(null);
      setError(null);
    }
  }, [open, invoiceId]);

  const fetchInvoice = async () => {
    if (!invoiceId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getInvoice(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      const errorMessage = err?.message || t("error") || "Failed to load invoice";
      setError(errorMessage);
      toast({
        title: t("error") || "שגיאה",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (invoice?.greenInvoice?.originalDocumentUrl) {
      window.open(invoice.greenInvoice.originalDocumentUrl, "_blank");
    } else {
      toast({
        title: t("error") || "שגיאה",
        description: t("invoice_download_not_available") || "קישור להורדת החשבונית לא זמין",
        variant: "destructive",
      });
    }
  };

  const externalInvoiceNumber =
    invoice?.externalInvoiceNumber ||
    invoice?.greenInvoice?.id ||
    invoice?.icount?.id ||
    invoice?.invoiceNumber;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {t("invoice") || "חשבונית"} {externalInvoiceNumber || ""}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              <div className="border rounded-md overflow-hidden h-[70vh]">
                {invoice.greenInvoice?.originalDocumentUrl ? (
                  <Worker workerUrl={PDF_WORKER_URL}>
                    <Viewer
                      fileUrl={invoice.greenInvoice.originalDocumentUrl}
                      plugins={[defaultLayoutPluginInstance]}
                      renderError={() => (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
                          {t("invoice_preview_not_available") || "תצוגת החשבונית אינה זמינה"}
                        </div>
                      )}
                      renderLoader={() => (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      )}
                    />
                  </Worker>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
                    {t("invoice_preview_not_available") || "תצוגת החשבונית אינה זמינה"}
                  </div>
                )}
              </div>

              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("invoice_number") || "מספר חשבונית"}
                  </p>
                  <p className="text-lg font-semibold">
                    {externalInvoiceNumber || "-"}
                  </p>
                  {externalInvoiceNumber && invoice.invoiceNumber !== externalInvoiceNumber && (
                    <p className="text-xs text-muted-foreground">
                      ({t("internal_invoice_number") || "מספר חשבונית פנימי"}: {invoice.invoiceNumber})
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("invoice_date") || "תאריך חשבונית"}
                  </p>
                  <p className="text-lg">
                    {invoice.invoiceDate
                      ? formatDateForDisplay(invoice.invoiceDate) || "-"
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Client Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">{t("client") || "לקוח"}</h3>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">{invoice.client.name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("id_number") || "תעודת זהות"}: {invoice.client.personalId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("email") || "אימייל"}: {invoice.client.email}
                  </p>
                  {invoice.client.phone && (
                    <p className="text-sm text-muted-foreground">
                      {t("phone") || "טלפון"}: {invoice.client.phone}
                    </p>
                  )}
                  {invoice.client.address && (
                    <p className="text-sm text-muted-foreground">
                      {t("address") || "כתובת"}: {invoice.client.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">{t("items") || "פריטים"}</h3>
                <div className="space-y-2">
                  {invoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {t("quantity") || "כמות"}: {item.quantity} × {item.price} {invoice.currency || "ILS"}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {(item.quantity * item.price).toFixed(2)} {invoice.currency || "ILS"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("subtotal") || "סה\"כ לפני מע\"מ"}</span>
                    <span className="font-medium">{invoice.subtotal.toFixed(2)} {invoice.currency || "ILS"}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("tax") || "מע\"מ"}</span>
                      <span className="font-medium">{invoice.tax.toFixed(2)} {invoice.currency || "ILS"}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>{t("total") || "סה\"כ"}</span>
                    <span>{invoice.total.toFixed(2)} {invoice.currency || "ILS"}</span>
                  </div>
                  {invoice.paidAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("paid_amount") || "סכום ששולם"}</span>
                      <span>{invoice.paidAmount.toFixed(2)} {invoice.currency || "ILS"}</span>
                    </div>
                  )}
                  {invoice.remainingAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("remaining_amount") || "יתרה"}</span>
                      <span>{invoice.remainingAmount.toFixed(2)} {invoice.currency || "ILS"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {invoice.description && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">{t("description") || "תיאור"}</h3>
                  <p className="text-sm text-muted-foreground">{invoice.description}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close") || "סגור"}
          </Button>
          {invoice?.greenInvoice?.originalDocumentUrl && (
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              {t("download_invoice") || "הורד חשבונית"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

