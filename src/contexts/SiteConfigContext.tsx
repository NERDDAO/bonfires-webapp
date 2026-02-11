"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
} from "react";

import { resolveSiteConfig } from "@/config/sites";
import type { SiteConfig, ThemeConfig } from "@/config/sites";

import { useSubdomainBonfire } from "./SubdomainBonfireContext";

// ─── Context ────────────────────────────────────────────────────────────────

const SiteConfigContext = createContext<SiteConfig | null>(null);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build an inline CSS string that sets brand CSS custom properties on :root. */
function themeToCSS(theme: ThemeConfig): string {
  return `:root {
  --color-brand-primary: ${theme.brandPrimary};
  --color-brand-secondary: ${theme.brandSecondary};
  --color-brand-black: ${theme.brandBlack};
  --color-brand-skyblue: ${theme.brandSkyblue};
}`;
}

// ─── Provider ───────────────────────────────────────────────────────────────

interface SiteConfigProviderProps {
  children: ReactNode;
}

/**
 * Resolves and provides the SiteConfig for the current domain.
 *
 * Must be rendered inside SubdomainBonfireProvider (reads isSubdomainScoped)
 * and outside any component that needs the config (Navbar, landing page, etc.).
 *
 * Theme colors are applied two ways to prevent any flash:
 * 1. An inline <style> tag in the render tree — included in the SSR HTML so
 *    the correct colors are present from the very first paint.
 * 2. A useLayoutEffect that sets the same values on document.documentElement
 *    (for dynamic updates if the config ever changes at runtime).
 */
export function SiteConfigProvider({ children }: SiteConfigProviderProps) {
  const { isSubdomainScoped, subdomainConfig } = useSubdomainBonfire();
  const slug = subdomainConfig?.slug ?? null;

  const siteConfig = useMemo(
    () => resolveSiteConfig(isSubdomainScoped, slug),
    [isSubdomainScoped, slug],
  );

  const themeCSS = useMemo(() => themeToCSS(siteConfig.theme), [siteConfig]);

  // Sync theme CSS variables to :root for runtime updates.
  // useLayoutEffect fires before the browser paints, preventing flicker
  // on client-side navigations.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const { theme } = siteConfig;

    root.style.setProperty("--color-brand-primary", theme.brandPrimary);
    root.style.setProperty("--color-brand-secondary", theme.brandSecondary);
    root.style.setProperty("--color-brand-black", theme.brandBlack);
    root.style.setProperty("--color-brand-skyblue", theme.brandSkyblue);

    return () => {
      root.style.removeProperty("--color-brand-primary");
      root.style.removeProperty("--color-brand-secondary");
      root.style.removeProperty("--color-brand-black");
      root.style.removeProperty("--color-brand-skyblue");
    };
  }, [siteConfig]);

  return (
    <SiteConfigContext.Provider value={siteConfig}>
      {/* Inline <style> ensures correct theme is in the server-rendered HTML,
          so there is zero flash even on the very first page load. */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      {children}
    </SiteConfigContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Read the resolved SiteConfig for the current domain.
 *
 * Returns the full config -- consumers never need to check
 * "am I on root or a bonfire?" -- they just read the values.
 */
export function useSiteConfig(): SiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error("useSiteConfig must be used within a SiteConfigProvider");
  }
  return ctx;
}
