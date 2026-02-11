/**
 * Site Configuration Resolver
 *
 * Single decision point: isSubdomainScoped → defaultSiteConfig or rootSiteConfig.
 * Everything downstream reads config values, never checks "what kind of site am I."
 *
 * ## Extending for per-bonfire overrides (future)
 *
 * When the backend BonfireInfo model includes a `site_config` field
 * (see BonfireSiteConfigOverrides in types.ts), the resolver signature
 * becomes:
 *
 *   resolveSiteConfig(isSubdomainScoped, slug, backendOverrides?)
 *
 * and merges: { ...defaultSiteConfig, ...backendOverrides }.
 * No consumer code changes. The hardcoded SLUG_OVERRIDES below should
 * then be removed in favor of backend-driven config.
 */
export type {
  BonfireSiteConfigOverrides,
  FeatureFlags,
  NavigationItem,
  SiteConfig,
  ThemeConfig,
} from "./types";

export { defaultSiteConfig } from "./default";
export { rootSiteConfig } from "./root";

import BonfireLanding from "@/components/landing-page/bonfire-landing";
import { siteCopy } from "@/content/site";

import { defaultSiteConfig } from "./default";
import { rootSiteConfig } from "./root";
import type { BonfireSiteConfigOverrides, SiteConfig } from "./types";

// ─── Hardcoded per-slug overrides ────────────────────────────────────────────
//
// TODO: Replace with backend-driven config once BonfireInfo includes a
// `site_config` field. These are stopgap overrides keyed by subdomain slug.
// Only bonfires that differ from the default need an entry here.
//
const SLUG_OVERRIDES: Record<string, Partial<SiteConfig>> = {
  boulder: {
    navigation: [
      { label: "Home", href: "/" },
      ...defaultSiteConfig.navigation,
    ],
    landing: BonfireLanding,
    features: {
      ...defaultSiteConfig.features,
      homePage: true,
    },
  },
};

/**
 * Resolve the site config for the current domain.
 *
 * @param isSubdomainScoped - true when on a bonfire subdomain
 * @param slug - the subdomain slug (e.g. "boulder"), null for root
 * @param overrides - optional per-bonfire overrides from the backend (future)
 */
export function resolveSiteConfig(
  isSubdomainScoped: boolean,
  slug?: string | null,
  overrides?: BonfireSiteConfigOverrides | null,
): SiteConfig {
  const base = isSubdomainScoped ? defaultSiteConfig : rootSiteConfig;

  // Apply hardcoded slug overrides (TODO: replace with backend config)
  const slugOverride = slug ? SLUG_OVERRIDES[slug] : undefined;
  const withSlug = slugOverride ? { ...base, ...slugOverride } : base;

  if (!overrides) return withSlug;

  // Merge per-bonfire backend overrides on top
  return {
    ...withSlug,
    theme: { ...withSlug.theme, ...overrides.theme },
    features: { ...withSlug.features, ...overrides.features },
    navigation: overrides.navigation ?? withSlug.navigation,
    // landingVariant mapping would go here once a component registry exists
    landing: withSlug.landing,
  };
}
