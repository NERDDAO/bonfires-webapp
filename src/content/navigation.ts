import { NavigationItem } from "@/components/navbar";

import { siteCopy } from "./site";

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Explore",
    href: "/explore",
  },
  {
    label: "Graph Explorer",
    href: "/graph",
  },
  {
    label: "Docs",
    href: siteCopy.docsUrl,
  },
] as const;
