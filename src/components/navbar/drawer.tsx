"use client";

import Image from "next/image";
import Link from "next/link";

import { useSiteConfig } from "@/contexts";

import { Drawer as DrawerComponent } from "@/components/ui/drawer";

import ConnectWallet from "./connect-wallet";
import Signin from "./signin";

const drawerLinkClass =
  "block px-6 py-3 text-dark-s-0/90 no-underline transition-colors hover:bg-[#1A1C1F] hover:text-dark-s-0";

export default function Drawer({
  drawerOpen,
  closeDrawer,
  showSignin = false,
}: {
  drawerOpen: boolean;
  closeDrawer: () => void;
  showSignin?: boolean;
}) {
  const { navigation: navigationItems } = useSiteConfig();

  return (
    <DrawerComponent isOpen={drawerOpen} onClose={closeDrawer} side="right">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={closeDrawer}
          className="mr-auto p-2 text-dark-s-100 hover:bg-dark-s-700 hover:text-dark-s-30 transition-colors rounded-lg"
          aria-label="Close menu"
        >
          <Image src="/icons/close.svg" alt="Close" width={12} height={12} />
        </button>

        <div className="flex items-center gap-2">
          {showSignin && <Signin />}
          <ConnectWallet />
        </div>
      </div>

      <nav className="flex flex-col py-2" aria-label="Mobile navigation">
        <ul className="list-none min-w-40">
          {navigationItems.flatMap((item) => {
            const { label, href, dropdownItems } = item;
            if (dropdownItems?.length) {
              return dropdownItems.map((sub) => (
                <li key={sub.label}>
                  <Link
                    href={sub.href}
                    onClick={closeDrawer}
                    className={drawerLinkClass}
                    target={sub.href.startsWith("http") ? "_blank" : undefined}
                  >
                    {sub.label}
                  </Link>
                </li>
              ));
            }
            if (href) {
              return [
                <li key={label}>
                  <Link
                    href={href}
                    onClick={closeDrawer}
                    className={drawerLinkClass}
                    target={href.startsWith("http") ? "_blank" : undefined}
                  >
                    {label}
                  </Link>
                </li>,
              ];
            }
            return [];
          })}
        </ul>
      </nav>
    </DrawerComponent>
  );
}
