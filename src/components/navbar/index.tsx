"use client";

import { useMemo } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/content";

import { NavbarButton } from "./NavbarButton";
import { AuthSection } from "./AuthSection";
import WalletButton from "./WalletButton";

export interface NavigationItem {
  label: string;
  href?: string;
  dropdownItems?: { label: string; href: string }[];
}

export function Navbar() {
  const pathname = usePathname();
  const activeSection = useMemo((): NavigationItem => {
    const matched = navigationItems
      .filter((item) => item.href !== "/")
      .find((item) => pathname.split("/")[1] === item.href?.split("/")[1]);
    return matched ?? navigationItems[0] ?? { label: "Home", dropdownItems: [] };
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between w-full bg-brand-black py-4 px-20 min-h-20">
      <Link href="/" className="flex items-center shrink-0" aria-label="Home">
        <Image
          src="/logo-white.svg"
          alt=""
          width={160}
          height={30}
          className="h-8 w-auto"
          priority
        />
      </Link>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        {navigationItems.map((item) => (
          <NavbarButton
            key={item.label}
            isActive={activeSection.label === item.label}
            navigationItem={item}
          />
        ))}
      </div>

      {/* Auth and Wallet buttons */}
      <div className="navbar-end flex items-center gap-2">
        <AuthSection />
        <WalletButton />
      </div>
    </nav>
  );
}
