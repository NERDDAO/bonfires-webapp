/**
 * Root domain site config -- used for app.bonfires.ai (no subdomain).
 *
 * Different navigation (no Graph Explorer, adds Explore Bonfires),
 * different theme colors, and a distinct landing page.
 */
import RootLanding from "@/components/landing-page/root-landing";
import { siteCopy } from "@/content/site";

import type { SiteConfig } from "./types";

export const rootSiteConfig: SiteConfig = {
  navigation: [
    { label: "Home", href: "/" },
    { label: "Hyperblogs", href: "/hyperblogs" },
    { label: "Explore Bonfires", href: "/explore" },
    { label: "Docs", href: siteCopy.docsUrl },
  ],

  theme: {
    brandPrimary: "#f5572a",
    brandSecondary: "#ff8a5c",
    brandBlack: "#0a1216",
    brandSkyblue: "#f5572a",
  },

  landing: RootLanding,

  features: {
    graphExplorer: false,
    exploreBonfires: true,
    homePage: true,
  },
};
