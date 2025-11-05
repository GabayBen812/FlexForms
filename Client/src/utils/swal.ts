import Swal from 'sweetalert2';
import i18n from '@/i18n';

/**
 * Get the current language direction (RTL for Hebrew, LTR for English)
 */
const getDirection = (): 'rtl' | 'ltr' => {
  return i18n.language === 'he' ? 'rtl' : 'ltr';
};

/**
 * Common SweetAlert2 configuration with RTL support
 */
const getSwalConfig = () => ({
  direction: getDirection() as 'rtl' | 'ltr',
  buttonsStyling: true,
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#6b7280',
  reverseButtons: getDirection() === 'rtl',
});

/**
 * Show an alert (replaces window.alert())
 */
export const showAlert = (
  message: string,
  title?: string,
  icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info'
) => {
  return Swal.fire({
    ...getSwalConfig(),
    title: title || '',
    text: message,
    icon,
    confirmButtonText: i18n.t('common:ok') || 'OK',
  });
};

/**
 * Show a confirmation dialog (replaces window.confirm())
 */
export const showConfirm = (
  message: string,
  title?: string,
  confirmText?: string,
  cancelText?: string
): Promise<boolean> => {
  return Swal.fire({
    ...getSwalConfig(),
    title: title || '',
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText || i18n.t('common:confirm') || 'Confirm',
    cancelButtonText: cancelText || i18n.t('common:cancel') || 'Cancel',
  }).then((result) => {
    return result.isConfirmed;
  });
};

/**
 * Show a success alert
 */
export const showSuccess = (message: string, title?: string) => {
  return showAlert(message, title || i18n.t('common:success') || i18n.t('success') || 'Success', 'success');
};

/**
 * Show an error alert
 */
export const showError = (message: string, title?: string) => {
  return showAlert(message, title || i18n.t('common:error') || i18n.t('error') || 'Error', 'error');
};

/**
 * Show a warning alert
 */
export const showWarning = (message: string, title?: string) => {
  return showAlert(message, title || i18n.t('common:warning') || 'Warning', 'warning');
};

/**
 * Show an info alert
 */
export const showInfo = (message: string, title?: string) => {
  return showAlert(message, title || i18n.t('common:info') || 'Info', 'info');
};

