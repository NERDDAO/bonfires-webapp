/**
 * Error Message Component
 * Displays error messages with optional retry action
 */
import React from "react";

import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/cn";

interface ErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Optional title */
  title?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Variant style */
  variant?: "inline" | "card" | "alert";
}

export function ErrorMessage({
  message,
  title = "Error",
  onRetry,
  className,
  variant = "alert",
}: ErrorMessageProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-error", className)}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-xs btn-ghost text-error">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("card bg-error/10 border border-error/20", className)}>
        <div className="card-body p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-error">{title}</h3>
              <p className="text-sm text-base-content/70 mt-1">{message}</p>
              {onRetry && (
                <button onClick={onRetry} className="btn btn-sm btn-error mt-3">
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: alert variant
  return (
    <div role="alert" className={cn("alert alert-error", className)}>
      <AlertCircle className="w-5 h-5" />
      <div className="flex flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-sm">{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-sm btn-ghost">
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
