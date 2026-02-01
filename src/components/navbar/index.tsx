"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/content";

import { NavbarButton } from "./NavbarButton";
import { AuthSection } from "./AuthSection";
import Drawer from "./drawer";
import ConnectWallet from "./connect-wallet";


export interface NavigationItem {
  label: string;
  href?: string;
  dropdownItems?: { label: string; href: string }[];
}

export function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeSection = useMemo((): NavigationItem => {
    const matched = navigationItems
      .filter((item) => item.href !== "/")
      .find((item) => pathname.split("/")[1] === item.href?.split("/")[1]);
    return matched ?? navigationItems[0] ?? { label: "Home", dropdownItems: [] };
  }, [pathname]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between w-full bg-brand-black px-8 lg:px-20 min-h-16 lg:min-h-20">
      <Link href="/" className="flex items-center shrink-0" aria-label="Home">
        <Image
          src="/logo-white.svg"
          alt=""
          width={160}
          height={30}
          className="h-6 lg:h-8 w-auto"
          priority
        />
      </Link>

      {/* Desktop: center nav buttons */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-2">
        {navigationItems.map((item) => (
          <NavbarButton
            key={item.label}
            isActive={activeSection.label === item.label}
            navigationItem={item}
          />
        ))}
      </div>

      {/* Tablet/mobile: hamburger that opens drawer */}
      <div className="flex lg:hidden items-center justify-center">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
        >
          <Image
            src="/icons/hamburger.svg"
            alt=""
            width={24}
            height={20}
            className="h-5 w-auto"
          />
        </button>
      </div>

      <Drawer
        drawerOpen={drawerOpen}
        closeDrawer={closeDrawer}
      />

      {/* Auth and Wallet buttons */}
      <div className="navbar-end items-center gap-2 hidden lg:flex">
        <AuthSection />
        <ConnectWallet />
      </div>
    </nav>
  );
}
