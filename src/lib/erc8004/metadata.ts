/**
 * ERC-8004 Metadata Builder
 *
 * Constructs the JSON metadata object conforming to the ERC-8004 registration
 * file spec (https://eips.ethereum.org/EIPS/eip-8004#registration-v1).
 */
import type { ProvisionFormData } from "@/types";

const ERC8004_TYPE = "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
const DEFAULT_CHAIN_ID = "1";
const DEFAULT_APP_ROOT = "app.bonfires.ai";

export interface Erc8004ServiceEntry {
  name: string;
  endpoint: string;
  x402Support?: boolean;
  version?: string;
}

export interface Erc8004Registration {
  agentId: number | null;
  agentRegistry: string;
}

export interface Erc8004Metadata {
  type: string;
  name: string;
  description: string;
  image: string;
  services: Erc8004ServiceEntry[];
  capabilities: string[];
  x402Support: boolean;
  active: boolean;
  registrations: Erc8004Registration[];
  supportedTrust: string[];
}

/**
 * Derive a URL-safe subdomain slug from a bonfire name.
 * "My Research Bonfire" -> "my-research-bonfire"
 */
function toBonfireSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "bonfire";
}

/**
 * Build an ERC-8004 compliant registration file from provision form data.
 *
 * Environment variables used (server-side only):
 *  - NEXT_PUBLIC_APP_ROOTS              — comma-separated app roots (default "app.bonfires.ai")
 *  - NEXT_PUBLIC_DELVE_API_URL          — Delve API endpoint (fallback for API service)
 *  - NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS — on-chain registry address
 *  - NEXT_PUBLIC_PROVISION_WRAPPER_ADDRESS — BonfireProvisionWrapper address
 *  - NEXT_PUBLIC_CHAIN_ID               — chain ID (default "1")
 */
export function buildErc8004Metadata(form: ProvisionFormData): Erc8004Metadata {
  const appRoot =
    process.env["NEXT_PUBLIC_APP_ROOTS"]?.split(",")[0]?.trim() || DEFAULT_APP_ROOT;
  const apiEndpoint =
    process.env["NEXT_PUBLIC_DELVE_API_URL"] ?? "http://localhost:8000";
  const registryAddress =
    process.env["NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS"] ?? "";
  const wrapperAddress =
    process.env["NEXT_PUBLIC_PROVISION_WRAPPER_ADDRESS"] ?? "";
  const chainId = process.env["NEXT_PUBLIC_CHAIN_ID"] ?? DEFAULT_CHAIN_ID;

  const slug = toBonfireSlug(form.agentName);
  const bonfireUrl = `https://${slug}.${appRoot}`;

  const services: Erc8004ServiceEntry[] = [
    { name: "web", endpoint: bonfireUrl, x402Support: true },
    { name: "api", endpoint: apiEndpoint, x402Support: true },
  ];

  if (wrapperAddress) {
    services.push({
      name: "provision",
      endpoint: `eip155:${chainId}:${wrapperAddress}`,
    });
  }

  const agentRegistry = registryAddress
    ? `eip155:${chainId}:${registryAddress}`
    : "";

  return {
    type: ERC8004_TYPE,
    name: form.agentName,
    description: form.description,
    image: form.image,
    services,
    capabilities: form.capabilities,
    x402Support: true,
    active: true,
    registrations: agentRegistry
      ? [{ agentId: null, agentRegistry }]
      : [],
    supportedTrust: ["reputation"],
  };
}
