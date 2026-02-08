"use client";

/**
 * SelectDropdown
 *
 * Custom dropdown that behaves like a select: options with value/label,
 * single selection, click-outside to close. Styling via className props.
 */
import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { cn } from "@/lib/cn";

export interface SelectDropdownOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  /** Currently selected value (option.value) or null for none */
  value: string | null;
  /** Options to show in the list */
  options: SelectDropdownOption[];
  /** Shown when no value selected */
  placeholder: string;
  /** Called when user selects an option (null when clearing) */
  onChange: (value: string | null) => void;
  /** Disable the trigger */
  disabled?: boolean;
  /** id for the trigger (for label association) */
  id?: string;
  /** aria-label for the trigger */
  "aria-label"?: string;
  /** Root wrapper className */
  className?: string;
  /** Dropdown panel className */
  contentClassName?: string;
}

export function SelectDropdown({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  id,
  "aria-label": ariaLabel,
  className,
  contentClassName,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedOption = value
    ? (options.find((o) => o.value === value) ?? null)
    : null;
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div
      className={cn("relative", className ?? "w-full")}
      ref={containerRef}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? `${id ?? "dropdown"}-listbox` : undefined}
      id={id}
    >
      <button
        type="button"
        className={cn(
          "w-full min-w-0 text-left rounded-xl px-3 py-2.5 text-sm lg:text-base",
          "bg-[#181818] border border-[#333333] text-white",
          "focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-[#646464]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-between gap-2",
          !selectedOption && "text-[#A9A9A9]"
        )}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <span className="truncate">{displayText}</span>
        <span
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <Image
            src="/icons/chevron-down.svg"
            alt="Chevron down"
            width={16}
            height={16}
          />
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={`${id ?? "dropdown"}-listbox`}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl",
            "bg-[#1a1a1a] border border-[#333333] shadow-lg",
            "py-1",
            contentClassName
          )}
          onMouseDown={(e) => e.preventDefault()}
        >
          {options.length === 0 ? (
            <div className={cn("px-3 py-2.5 text-sm text-[#A9A9A9]")}>
              No options
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm lg:text-base",
                    "hover:bg-[#181818]/40 focus:bg-[#181818]/40 focus:outline-none",
                    isSelected && "bg-[#FFFFFF08] text-white",
                    !isSelected && "text-[#e5e5e5]"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
