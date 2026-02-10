import { NavigationItem } from "@/components/navbar";

import { siteCopy } from "./site";

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
    href: siteCopy.docsUrl,
  },
] as const;
