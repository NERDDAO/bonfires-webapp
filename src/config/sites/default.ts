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
    { label: "Hyperblogs", href: "/hyperblogs" },
    { label: "Graph Explorer", href: "/graph" },
    { label: "Docs", href: siteCopy.docsUrl },
  ],

  theme: {
    brandPrimary: "#b2ff00",
    brandSecondary: "#81a236",
    brandBlack: "#121212",
    brandSkyblue: "#4fc5ff",
  },

  landing: BonfireLanding,

  features: {
    graphExplorer: true,
    exploreBonfires: false,
    homePage: false,
  },
};
