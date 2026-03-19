"use client";

import Link from "next/link";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

import { NavigationItem } from ".";
import Dropdown from "../ui/dropdown";

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

  const buttonClasses = cn(
    "bf-nav-link",
    isActive && "active"
  );

  // No dropdown: render as link
  if (!dropdownItems?.length && href) {
    return (
      <Link
        href={href}
        className={cn(buttonClasses, "cursor-pointer no-underline")}
        target={href.startsWith("http") ? "_blank" : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <Dropdown
      trigger={(open, onToggle) => (
        <button
          type="button"
          onClick={onToggle}
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
      )}
    >
      {dropdownItems && (
        <ul
          id="navbar-dropdown-menu"
          role="menu"
          aria-labelledby="navbar-dropdown-trigger"
          className="absolute left-0 top-full z-100 mt-1 min-w-40 list-none rounded-b-lg rounded-t-none"
          style={{ background: "var(--bf-surface)" }}
        >
          {dropdownItems.map((item) => (
            <li key={item.label} role="none">
              <Link
                href={item.href}
                role="menuitem"
                className="block px-6 py-3 text-dark-s-0/90 no-underline transition-colors hover:bg-[#1A1C1F] hover:text-dark-s-0"
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Dropdown>
  );
}
