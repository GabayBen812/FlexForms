import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '@/api/apiClient';
import { useToast } from '@/hooks/use-toast';

interface UsePdfExportReturn {
  exportToPdf: (registrationIds: string[]) => Promise<void>;
  isExporting: boolean;
}

export function usePdfExport(): UsePdfExportReturn {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = async (registrationIds: string[]) => {
    if (!registrationIds || registrationIds.length === 0) {
      toast({
        title: t('error'),
        description: t('export_failed'),
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Prepare translations object for PDF
      const translations = {
        formTitle: t('form_registration_pdf_title'),
        registrationDetails: t('pdf_registration_details'),
        childInformation: t('pdf_child_information'),
        formFields: t('pdf_form_fields'),
        paymentDetails: t('pdf_payment_details'),
        registeredAt: t('pdf_registered_at'),
        fullName: t('pdf_full_name'),
        email: t('pdf_email'),
        phone: t('pdf_phone'),
        name: t('pdf_name'),
        idNumber: t('pdf_id_number'),
        birthDate: t('pdf_birth_date'),
        gender: t('pdf_gender'),
        address: t('pdf_address'),
        cardOwnerName: t('pdf_card_owner_name'),
        last4Digits: t('pdf_last_4_digits'),
        amountPaid: t('pdf_amount_paid'),
        paymentDate: t('pdf_payment_date'),
        lowProfileCode: t('pdf_low_profile_code'),
        termsAccepted: t('pdf_terms_accepted'),
        termsNotAccepted: t('pdf_terms_not_accepted'),
        officialDocument: t('pdf_official_document'),
        generatedAt: t('pdf_generated_at'),
        dynamicFields: t('pdf_dynamic_fields'),
        field: t('pdf_field'),
        value: t('pdf_value'),
        downloadFile: t('pdf_download_file'),
      };

      const language = i18n.language === 'he' ? 'he' : 'en';

      // Make API request
      const response = await apiClient.post(
        '/registrations/export-pdf',
        {
          registrationIds,
          language,
          translations,
        },
        {
          responseType: 'blob', // Important for binary data
        }
      );

      // Create blob from response
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      });

      // Extract filename from Content-Disposition header or use default
      let filename = 'registration_export.pdf';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('success'),
        description: t('export_success'),
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: t('error'),
        description: error.response?.data?.message || t('export_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPdf,
    isExporting,
  };
}

