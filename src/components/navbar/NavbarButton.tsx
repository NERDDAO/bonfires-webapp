"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

import { NavigationItem } from ".";

/**
 * NavbarButton – dropdown trigger with a menu of links.
 * Uses controlled open state, click-outside to close.
 */
export function NavbarButton({
  isActive = false,
  navigationItem,
}: {
  isActive: boolean;
  navigationItem: NavigationItem;
}) {
  const { label, href, dropdownItems } = navigationItem;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonClasses = cn(
    "inline-flex items-center gap-2 rounded-lg px-6 py-3 transition-colors hover:bg-[#1A1C1F] hover:text-dark-s-0 rounded-t-lg rounded-b-none border-b",
    isActive
      ? "bg-dark-s-800/50 text-dark-s-0 border-b-brand-skyblue"
      : "bg-brand-bg text-dark-s-0/70 border-b-transparent"
  );

  // No dropdown: render as link
  if (!dropdownItems?.length && href) {
    return (
      <Link
        href={href}
        className={cn(buttonClasses, "cursor-pointer no-underline")}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="navbar-dropdown-menu"
        id="navbar-dropdown-trigger"
        className={cn(buttonClasses, "cursor-pointer")}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && dropdownItems && (
        <ul
          id="navbar-dropdown-menu"
          role="menu"
          aria-labelledby="navbar-dropdown-trigger"
          className="absolute left-0 top-full z-100 mt-1 min-w-40 list-none rounded-b-lg rounded-t-none bg-brand-black"
        >
          {dropdownItems.map((item) => (
            <li key={item.label} role="none">
              <Link
                href={item.href}
                role="menuitem"
                onClick={close}
                className="block px-6 py-3 text-dark-s-0/90 no-underline transition-colors hover:bg-dark-s-800/50 hover:text-dark-s-0"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
