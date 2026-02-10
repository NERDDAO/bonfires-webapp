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
 *   resolveSiteConfig(isSubdomainScoped, backendOverrides?)
 *
 * and merges: { ...defaultSiteConfig, ...backendOverrides }.
 * No consumer code changes.
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

import { defaultSiteConfig } from "./default";
import { rootSiteConfig } from "./root";
import type { BonfireSiteConfigOverrides, SiteConfig } from "./types";

/**
 * Resolve the site config for the current domain.
 *
 * @param isSubdomainScoped - true when on a bonfire subdomain
 * @param overrides - optional per-bonfire overrides from the backend (future)
 */
export function resolveSiteConfig(
  isSubdomainScoped: boolean,
  overrides?: BonfireSiteConfigOverrides | null,
): SiteConfig {
  const base = isSubdomainScoped ? defaultSiteConfig : rootSiteConfig;

  if (!overrides) return base;

  // Merge per-bonfire overrides into the base config
  return {
    ...base,
    theme: { ...base.theme, ...overrides.theme },
    features: { ...base.features, ...overrides.features },
    navigation: overrides.navigation ?? base.navigation,
    // landingVariant mapping would go here once a component registry exists
    landing: base.landing,
  };
}
