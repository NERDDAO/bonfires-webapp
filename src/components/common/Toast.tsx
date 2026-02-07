/**
 * Toast Notification Component
 * Using react-hot-toast for notifications
 */
"use client";

import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Toaster, toast as hotToast } from "react-hot-toast";

/**
 * Toast Notification Component
 * Using react-hot-toast for notifications
 */

/** Toast configuration */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "hsl(var(--b2))",
          color: "hsl(var(--bc))",
          borderRadius: "var(--rounded-box)",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "hsl(var(--su))",
            secondary: "hsl(var(--suc))",
          },
        },
        error: {
          iconTheme: {
            primary: "hsl(var(--er))",
            secondary: "hsl(var(--erc))",
          },
        },
      }}
    />
  );
}

/** Toast utility functions */
export const toast = {
  success: (message: string, options?: { duration?: number }) => {
    return hotToast.success(message, {
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      duration: options?.duration,
    });
  },

  error: (message: string, options?: { duration?: number }) => {
    return hotToast.error(message, {
      icon: <AlertCircle className="w-5 h-5 text-error" />,
      duration: options?.duration ?? 5000,
    });
  },

  info: (message: string, options?: { duration?: number }) => {
    return hotToast(message, {
      icon: <Info className="w-5 h-5 text-info" />,
      duration: options?.duration,
    });
  },

  warning: (message: string, options?: { duration?: number }) => {
    return hotToast(message, {
      icon: <AlertTriangle className="w-5 h-5 text-warning" />,
      duration: options?.duration,
    });
  },

  loading: (message: string) => {
    return hotToast.loading(message);
  },

  dismiss: (id?: string) => {
    hotToast.dismiss(id);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => {
    return hotToast.promise(promise, messages);
  },
};

export default toast;
