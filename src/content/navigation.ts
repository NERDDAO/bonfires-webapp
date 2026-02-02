import { NavigationItem } from "@/components/navbar";

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    dropdownItems: [
      {
        label: "Home",
        href: "/",
      },
      {
        label: "Data Rooms",
        href: "/datarooms",
      },
    ],
  },
  {
    label: "Hyperblogs",
    href: "/hyperblogs",
  },
  {
    label: "Graph Explorer",
    href: "/graph",
  },
  {
    label: "Docs",
    href: "/documents",
  },
] as const;
