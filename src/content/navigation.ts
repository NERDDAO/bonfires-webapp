import { NavigationItem } from "@/components/navbar";

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    dropdownItems: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Hyperblogs",
    href: "/hyperblogs",
  },
  {
    label: "Graph Explorer",
    href: "/graph-explorer",
  },
  {
    label: "Docs",
    href: "/docs",
  },
] as const;
