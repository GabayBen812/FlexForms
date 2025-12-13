import { Alert, Platform } from 'react-native';

/**
 * Toast utility for cross-platform notifications
 * Uses native Alert on mobile and falls back to browser alert on web
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  description: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Show a toast notification
 * On native platforms, uses Alert.alert for better UX
 * On web, uses browser alert as fallback
 */
export const showToast = ({ title, description, type = 'info' }: ToastOptions) => {
  if (Platform.OS === 'web') {
    // Fallback for web
    alert(description);
  } else {
    // Native Alert with better UX
    Alert.alert(
      title || getDefaultTitle(type),
      description,
      [{ text: 'אישור', style: getAlertStyle(type) }],
      { cancelable: true }
    );
  }
};

function getDefaultTitle(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'הצלחה';
    case 'error':
      return 'שגיאה';
    case 'warning':
      return 'אזהרה';
    case 'info':
    default:
      return 'התראה';
  }
}

function getAlertStyle(type: ToastType): 'default' | 'cancel' | 'destructive' {
  switch (type) {
    case 'error':
      return 'destructive';
    case 'warning':
      return 'cancel';
    case 'success':
    case 'info':
    default:
      return 'default';
  }
}

/**
 * Show a success toast
 */
export const showSuccessToast = (description: string, title?: string) => {
  showToast({ title, description, type: 'success' });
};

/**
 * Show an error toast
 */
export const showErrorToast = (description: string, title?: string) => {
  showToast({ title, description, type: 'error' });
};

/**
 * Show a warning toast
 */
export const showWarningToast = (description: string, title?: string) => {
  showToast({ title, description, type: 'warning' });
};

/**
 * Show an info toast
 */
export const showInfoToast = (description: string, title?: string) => {
  showToast({ title, description, type: 'info' });
};



