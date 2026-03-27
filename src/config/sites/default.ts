/**
 * Default site config -- used for bonfire subdomains.
 *
 * This is the baseline config. The root domain and (in the future)
 * individual bonfires override specific values.
 */
import BonfireLanding from "@/components/landing-page/bonfire-landing";
import { siteCopy } from "@/content/site";

import type { SiteConfig } from "./types";

export const defaultSiteConfig: SiteConfig = {
  navigation: [
    { label: "Explore", href: "/explore" },
    { label: "Graph Explorer", href: "/graph" },
    { label: "Docs", href: siteCopy.docsUrl },
  ],

  theme: {
    brandPrimary: "#f5572a",
    brandSecondary: "#ff8a5c",
    brandBlack: "#0a1216",
    brandSkyblue: "#f5572a",
  },

  landing: BonfireLanding,

  features: {
    graphExplorer: true,
    exploreBonfires: false,
    homePage: false,
  },
};
