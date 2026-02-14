export { QueryProvider } from "./QueryProvider";
// Web3Provider is NOT re-exported here to prevent WalletConnect's IndexedDB
// side effects from leaking into server bundles via barrel imports.
// Import directly: import("@/contexts/Web3Provider")
export {
  SubdomainBonfireProvider,
  useSubdomainBonfire,
  type SubdomainConfig,
} from "./SubdomainBonfireContext";
export { SiteConfigProvider, useSiteConfig } from "./SiteConfigContext";
