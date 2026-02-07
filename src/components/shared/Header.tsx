"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OrganizationSwitcher, SignInButton, UserButton } from "@clerk/nextjs";

import { useAuth } from "@/hooks/useAuth";

import ConnectWallet from "../navbar/connect-wallet";

type NavSection = "graph" | "web3" | "documents" | "dashboard" | null;

interface HeaderProps {
  /** Custom class name */
  className?: string;
}

interface DropdownItem {
  href: string;
  label: string;
  description?: string;
}

const graphItems: DropdownItem[] = [
  {
    href: "/graph",
    label: "Graph Explorer",
    description: "Explore and visualize knowledge graphs",
  },
  {
    href: "/search",
    label: "Search & Expand",
    description: "Search and expand graph nodes",
  },
];

const web3Items: DropdownItem[] = [
  {
    href: "/datarooms",
    label: "Data Rooms",
    description: "Browse and subscribe to data rooms",
  },
  {
    href: "/hyperblogs",
    label: "HyperBlogs",
    description: "AI-generated blog posts from graphs",
  },
  {
    href: "/x402-chat",
    label: "x402 Chat",
    description: "Payment-gated chat with AI agents",
  },
  {
    href: "/x402-delve",
    label: "x402 Delve",
    description: "Payment-gated graph search",
  },
];

/**
 * Header Component
 *
 * Main navigation header with dropdowns for Graph and Web3 sections.
 *
 * Features:
 * - Logo with link to home
 * - Navigation dropdowns (Graph, Web3)
 * - Direct links (Documents, Dashboard)
 * - Active section highlighting
 * - Wallet button
 * - Responsive mobile menu
 */
export function Header({ className = "" }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<NavSection>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine active section from pathname
  const getActiveSection = (): NavSection => {
    if (pathname.startsWith("/graph") || pathname.startsWith("/search")) {
      return "graph";
    }
    if (
      pathname.startsWith("/datarooms") ||
      pathname.startsWith("/hyperblogs") ||
      pathname.startsWith("/x402")
    ) {
      return "web3";
    }
    if (pathname.startsWith("/documents")) {
      return "documents";
    }
    if (pathname.startsWith("/dashboard")) {
      return "dashboard";
    }
    return null;
  };

  const activeSection = getActiveSection();

  // Handle dropdown hover with delay for better UX
  function handleDropdownEnter(section: NavSection) {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(section);
  }

  function handleDropdownLeave() {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setActiveDropdown(null);
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header
      className={`navbar bg-base-100 shadow-sm sticky top-0 z-40 ${className}`}
    >
      <div className="navbar-start">
        {/* Mobile menu button */}
        <div className="dropdown lg:hidden">
          <button
            className="btn btn-ghost btn-circle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-64">
              <li className="menu-title">Graph</li>
              {graphItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex flex-col items-start">
                    <span>{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-base-content/50">
                        {item.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}

              <li className="menu-title mt-2">Web3</li>
              {web3Items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex flex-col items-start">
                    <span>{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-base-content/50">
                        {item.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}

              <div className="divider my-1" />

              <li>
                <Link href="/documents">Documents</Link>
              </li>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
            </ul>
          )}
        </div>

        {/* Logo */}
        <Link href="/" className="btn btn-ghost text-xl normal-case">
          <GraphIcon className="w-6 h-6 text-primary" />
          <span className="hidden sm:inline">Delve</span>
        </Link>
      </div>

      {/* Desktop navigation */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          {/* Graph dropdown */}
          <li
            className="relative"
            onMouseEnter={() => handleDropdownEnter("graph")}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              className={`flex items-center gap-1 ${activeSection === "graph" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === "graph" ? null : "graph");
              }}
            >
              Graph
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {activeDropdown === "graph" && (
              <ul className="absolute left-0 top-full mt-2 menu p-2 shadow-lg bg-base-200 rounded-box w-64 z-50">
                {graphItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex flex-col items-start py-3"
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-base-content/50">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Web3 dropdown */}
          <li
            className="relative"
            onMouseEnter={() => handleDropdownEnter("web3")}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              className={`flex items-center gap-1 ${activeSection === "web3" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === "web3" ? null : "web3");
              }}
            >
              Web3
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {activeDropdown === "web3" && (
              <ul className="absolute left-0 top-full mt-2 menu p-2 shadow-lg bg-base-200 rounded-box w-64 z-50">
                {web3Items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex flex-col items-start py-3"
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-base-content/50">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Documents link */}
          <li>
            <Link
              href="/documents"
              className={activeSection === "documents" ? "active" : ""}
            >
              Documents
            </Link>
          </li>

          {/* Dashboard link */}
          <li>
            <Link
              href="/dashboard"
              className={activeSection === "dashboard" ? "active" : ""}
            >
              Dashboard
            </Link>
          </li>
        </ul>
      </div>

      {/* Auth and Wallet buttons */}
      <div className="navbar-end flex items-center gap-2">
        <AuthSection />
        <ConnectWallet />
      </div>
    </header>
  );
}

/**
 * Authentication section of the header
 * Shows sign-in button when not authenticated,
 * or organization switcher and user button when authenticated.
 */
function AuthSection() {
  const { isSignedIn, isLoaded } = useAuth();

  // Don't render until auth is loaded to prevent flash
  if (!isLoaded) {
    return <div className="skeleton h-8 w-20 rounded-full" />;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="btn btn-ghost btn-sm">Sign In</button>
      </SignInButton>
    );
  }

  return (
    <>
      <OrganizationSwitcher
        hidePersonal={true}
        afterSelectOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            // Trigger button styling for dark header
            rootBox: "flex items-center",
            organizationSwitcherTrigger:
              "btn btn-ghost btn-sm normal-case gap-2 [&_*]:!text-base-content",
            organizationSwitcherTriggerIcon: "!text-base-content",
            // Dropdown - dark text on white background
            organizationSwitcherPopoverCard: "[&_*]:!text-gray-900",
          },
        }}
      />
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    </>
  );
}

// Icon components
function GraphIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
      />
    </svg>
  );
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

export default Header;
