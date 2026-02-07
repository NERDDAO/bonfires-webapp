"use client";

import { type ReactNode, useEffect, useState } from "react";

import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Which side the drawer slides in from */
  side?: "left" | "right";
  /** Close when clicking the backdrop (default: true) */
  closeOnBackdrop?: boolean;
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Extra class for the drawer panel */
  className?: string;
}

/**
 * Slide-in drawer with backdrop. Renders in a portal, locks scroll when open,
 * and supports backdrop click and Escape to close.
 */
export function Drawer({
  isOpen,
  onClose,
  children,
  side = "right",
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

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
      setMounted(false);
      const t = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(t);
    } else {
      setMounted(false);
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose();
  }

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  const translate = side === "right" ? "translate-x-full" : "-translate-x-full";
  const openTranslate = "translate-x-0";

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          mounted ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "relative z-10 flex h-full w-full max-w-sm flex-col transition-transform duration-200 ease-out",
          "bg-brand-black border-dark-s-700 shadow-2xl",
          side === "right" && "ml-auto border-l",
          side === "left" && "mr-auto border-r",
          mounted ? openTranslate : translate,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
