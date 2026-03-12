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
    brandPrimary: "#4fc5ff",
    brandSecondary: "#3a9fd4",
    brandBlack: "#0e1117",
    brandSkyblue: "#4fc5ff",
  },

  landing: RootLanding,

  features: {
    graphExplorer: false,
    exploreBonfires: true,
    homePage: true,
  },
};
