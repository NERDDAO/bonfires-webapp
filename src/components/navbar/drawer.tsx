import { Drawer as DrawerComponent } from "@/components/ui/drawer";
import { navigationItems } from "@/content";
import Link from "next/link";

const drawerLinkClass =
  "block px-6 py-3 text-dark-s-0/90 no-underline transition-colors hover:bg-[#1A1C1F] hover:text-dark-s-0";

export default function Drawer({ drawerOpen, closeDrawer }: { drawerOpen: boolean, closeDrawer: () => void }) {
  return (
    <DrawerComponent isOpen={drawerOpen} onClose={closeDrawer} side="right">
      <div className="flex items-center justify-between border-b border-dark-s-700 px-4 py-3">
        <span className="font-semibold text-dark-s-0">Menu</span>
        <button
          type="button"
          onClick={closeDrawer}
          className="p-2 text-dark-s-100 hover:bg-dark-s-700 hover:text-dark-s-30 transition-colors rounded-lg -mr-2"
          aria-label="Close menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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