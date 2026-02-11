/**
 * Site Configuration Types
 *
 * Uniform config shape for every domain (root or bonfire subdomain).
 *
 * ## Future: per-bonfire overrides from the backend
 *
 * The backend `BonfireInfo` model can be extended with an optional
 * `site_config` field (partial overrides):
 *
 * The frontend resolver would then merge:
 *   `{ ...defaultSiteConfig, ...backendOverrides }`
 *
 * This keeps the uniform shape -- every bonfire is still a SiteConfig,
 * just with different values merged from the backend.
 */
import type { ComponentType } from "react";

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavigationItem {
  label: string;
  href?: string;
  dropdownItems?: { label: string; href: string }[];
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface ThemeConfig {
  /** Primary brand accent (buttons, highlights). CSS color value. */
  brandPrimary: string;
  /** Secondary brand accent. */
  brandSecondary: string;
  /** Dark background / navbar color. */
  brandBlack: string;
  /** Sky-blue accent color. */
  brandSkyblue: string;
}

// ─── Features ────────────────────────────────────────────────────────────────

export interface FeatureFlags {
  /** Show the graph explorer page and nav link. */
  graphExplorer: boolean;
  /** Show the "Explore Bonfires" page and nav link. */
  exploreBonfires: boolean;
  /** Show a landing page at "/". When false, "/" redirects to /graph. */
  homePage: boolean;
}

// ─── Site Config (uniform shape) ─────────────────────────────────────────────

export interface SiteConfig {
  /** Navigation items rendered in navbar and mobile drawer. */
  navigation: NavigationItem[];

  /** Theme color overrides applied as CSS custom properties. */
  theme: ThemeConfig;

  /** The landing page component rendered at "/". */
  landing: ComponentType;

  /** Declarative feature flags -- no type branches, just booleans. */
  features: FeatureFlags;
}

// ─── Backend-drivable partial overrides (future) ─────────────────────────────

/**
 * Partial site config that a bonfire can send from the backend.
 * Used to merge with `defaultSiteConfig`:
 *
 *   const merged = mergeSiteConfig(defaultSiteConfig, backendOverrides);
 *
 * The `landing` field uses a string key (not a component) because
 * backend data is serializable. The resolver maps it to a component.
 */
export interface BonfireSiteConfigOverrides {
  theme?: Partial<ThemeConfig>;
  features?: Partial<FeatureFlags>;
  /** Navigation items to add, remove, or reorder. */
  navigation?: NavigationItem[];
  /** Key into a landing component registry (e.g. "default", "minimal", "custom"). */
  landingVariant?: string;
}
