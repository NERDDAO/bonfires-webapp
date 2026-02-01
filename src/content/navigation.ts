import { NavigationItem } from "@/components/navbar";

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    href: "/",
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
