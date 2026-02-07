"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { cn } from "@/lib/cn";

export interface DropdownItem {
  label: string;
  href: string;
}

interface NavigationButtonProps {
  label: string;
  href?: string;
  dropdownItems?: DropdownItem[];
  isActive: boolean;
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

const baseStyles =
  "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
const activeStyles = "bg-primary/20 text-primary";
const inactiveStyles =
  "text-base-content/80 hover:text-base-content hover:bg-base-content/10";

/**
 * NavigationButton – link or dropdown trigger with active/inactive states.
 * If dropdownItems are provided, opens dropdown on click or hover; dropdown items are links.
 */
export function NavigationButton({
  label,
  href,
  dropdownItems,
  isActive,
}: NavigationButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasDropdown = dropdownItems && dropdownItems.length > 0;

  function clearCloseTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 150);
  }

  function handleEnter() {
    clearCloseTimeout();
    if (hasDropdown) setDropdownOpen(true);
  }

  function handleLeave() {
    if (hasDropdown) scheduleClose();
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      clearCloseTimeout();
    };
  }, []);

  const buttonClasses = cn(
    baseStyles,
    isActive ? activeStyles : inactiveStyles
  );

  // Simple link when no dropdown
  if (!hasDropdown && href) {
    return (
      <li>
        <Link href={href} className={buttonClasses}>
          {label}
        </Link>
      </li>
    );
  }

  // Dropdown: open on click or hover
  return (
    <li>
      <div
        ref={containerRef}
        className="relative"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <button
          type="button"
          className={buttonClasses}
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen((prev) => !prev);
          }}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          {label}
          <ChevronDownIcon className="w-4 h-4 shrink-0" />
        </button>

        {dropdownOpen && (
          <ul
            className="absolute left-0 top-full mt-2 min-w-48 py-2 shadow-lg bg-base-200 rounded-box z-50 border border-base-content/10"
            onMouseEnter={clearCloseTimeout}
            onMouseLeave={scheduleClose}
          >
            {dropdownItems!.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-sm text-base-content hover:bg-base-content/10"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
