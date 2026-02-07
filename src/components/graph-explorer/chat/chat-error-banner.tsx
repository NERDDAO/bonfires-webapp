/**
 * Error banner for chat panel
 */
"use client";

import React from "react";

/**
 * Error banner for chat panel
 */

export interface ChatErrorBannerProps {
  error: string;
  onDismiss?: () => void;
}

export function ChatErrorBanner({ error, onDismiss }: ChatErrorBannerProps) {
  return (
    <div className="px-3 py-2 bg-error/10 border-t border-error/20">
      <div className="flex items-center justify-between">
        <span className="text-xs text-error">{error}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-error hover:underline"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
