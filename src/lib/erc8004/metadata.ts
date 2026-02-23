/**
 * ERC-8004 Metadata Builder
 *
 * Constructs the JSON metadata object conforming to the ERC-8004 registration
 * file spec (https://eips.ethereum.org/EIPS/eip-8004#registration-v1).
 */
import type { ProvisionFormData } from "@/types";

const ERC8004_TYPE = "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
const DEFAULT_CHAIN_ID = "1";

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
 * Build an ERC-8004 compliant registration file from provision form data.
 *
 * Environment variables used (server-side only):
 *  - NEXT_PUBLIC_DELVE_API_URL          — Delve API endpoint
 *  - NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS — on-chain registry address
 *  - NEXT_PUBLIC_PROVISION_WRAPPER_ADDRESS — BonfireProvisionWrapper address
 *  - NEXT_PUBLIC_CHAIN_ID               — chain ID (default "1")
 */
export function buildErc8004Metadata(form: ProvisionFormData): Erc8004Metadata {
  const endpoint =
    process.env["NEXT_PUBLIC_DELVE_API_URL"] ?? "http://localhost:8000";
  const registryAddress =
    process.env["NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS"] ?? "";
  const wrapperAddress =
    process.env["NEXT_PUBLIC_PROVISION_WRAPPER_ADDRESS"] ?? "";
  const chainId = process.env["NEXT_PUBLIC_CHAIN_ID"] ?? DEFAULT_CHAIN_ID;

  const services: Erc8004ServiceEntry[] = [
    { name: "web", endpoint, x402Support: true },
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
