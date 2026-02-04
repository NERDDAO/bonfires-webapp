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
    href: "https://docs.bonfires.ai/bonfires/docs/docs26/Welcome",
  },
] as const;
