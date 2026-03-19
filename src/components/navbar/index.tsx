"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/config/sites";
import { useSiteConfig } from "@/contexts";

import ConnectWallet from "./connect-wallet";
import Drawer from "./drawer";
import { NavbarButton } from "./navbar-button";
import Signin from "./signin";

export type { NavigationItem };

export function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { navigation: navigationItems } = useSiteConfig();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = navRef.current;
      if (!el) return;
      el.classList.toggle("scrolled", window.scrollY > 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeSection = useMemo((): NavigationItem => {
    const segment = pathname.split("/")[1];
    if (!segment)
      return navigationItems[0] ?? { label: "Home", dropdownItems: [] };
    const matched = navigationItems.find(
      (item) =>
        item.href?.startsWith("/") && item.href.split("/")[1] === segment
    );
    return (
      matched ?? navigationItems[0] ?? { label: "Home", dropdownItems: [] }
    );
  }, [pathname, navigationItems]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <nav ref={navRef} className="bf-nav">
      <Link href="/" className="bf-nav-logo" aria-label="Home">
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
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex bf-nav-links">
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
      <div className="hidden lg:flex items-center gap-2">
        <Signin />
        <ConnectWallet />
      </div>
    </nav>
  );
}
