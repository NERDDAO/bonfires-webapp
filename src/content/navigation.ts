import { NavigationItem } from "@/components/navbar";

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Hyperblogs",
    href: "/hyperblogs-2",
  },
  {
    label: "Graph Explorer",
    href: "/graph-explorer",
  },
  {
    label: "Docs",
    href: "https://docs.bonfires.ai/bonfires/docs/docs26/Welcome",
  },
] as const;
