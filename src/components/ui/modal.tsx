"use client";

import { type ReactNode, useEffect } from "react";

import { createPortal } from "react-dom";

import Image from "next/image";

import { InfoTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional title; when set, used for aria-labelledby */
  title?: string;
  /** Optional description; when set, used for aria-describedby */
  description?: string;
  /** Max width of the content box */
  size?: ModalSize;
  /** Close when clicking the backdrop (default: true) */
  closeOnBackdrop?: boolean;
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Show X close button (default: true) */
  showCloseButton?: boolean;
  /** Extra class for the modal content box */
  className?: string;
  /** Optional tooltip content; when set, shows an info icon with Radix tooltip */
  tooltipContent?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

/**
 * Reusable modal with blurred backdrop. Renders in a portal, locks scroll when open,
 * and supports backdrop click and Escape to close.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  tooltipContent,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose();
  }

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 p-4"
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden
      />

      {/* Modal content */}
      <div
        className={cn(
          "p-5 lg:p-7.5 relative z-10 w-full overflow-hidden rounded-2xl",
          "bg-brand-black border border-dark-s-700 shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title != null || showCloseButton) && (
          <div
            className={cn(
              "flex items-center justify-between",
              !description && "border-b border-dark-s-700"
            )}
          >
            {title != null ? (
              <div className="flex items-center gap-2">
                <h2
                  id="modal-title"
                  className="font-semibold text-lg text-dark-s-0 truncate"
                >
                  {title}
                </h2>
                {tooltipContent && (
                  <InfoTooltip
                    content={tooltipContent}
                    side="bottom"
                    sideAtLg="right"
                    iconSize="sm"
                  />
                )}
              </div>
            ) : (
              <div className="flex-1" />
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-3 text-dark-s-100 hover:bg-dark-s-700 hover:text-dark-s-30 transition-colors rounded-lg"
                aria-label="Close"
              >
                <Image
                  src="/icons/close.svg"
                  alt="Close"
                  width={12}
                  height={12}
                />
              </button>
            )}
          </div>
        )}

        {description && (
          <p id="modal-description" className="text-sm text-[#A9A9A9]">
            {description}
          </p>
        )}

        <div className="modal-content">{children}</div>
      </div>
    </div>,
    document.body
  );
}
