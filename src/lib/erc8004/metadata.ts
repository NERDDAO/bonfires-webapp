/**
 * ERC-8004 Metadata Builder
 *
 * Constructs the JSON metadata object conforming to the ERC-8004 standard
 * for on-chain Bonfire identity registration.
 */
import type { ProvisionFormData } from "@/types";

export interface Erc8004ServiceEntry {
  endpoint: string;
  x402Support: boolean;
}

export interface Erc8004Metadata {
  name: string;
  description: string;
  services: Erc8004ServiceEntry[];
  capabilities: string[];
}

/**
 * Build ERC-8004 compliant metadata JSON from provision form data.
 *
 * The `endpoint` is sourced from `NEXT_PUBLIC_DELVE_API_URL`. This function
 * is called server-side in the IPFS upload route, so env access is safe.
 */
export function buildErc8004Metadata(form: ProvisionFormData): Erc8004Metadata {
  const endpoint =
    process.env["NEXT_PUBLIC_DELVE_API_URL"] ?? "http://localhost:8000";

  return {
    name: form.agentName,
    description: form.description,
    services: [{ endpoint, x402Support: true }],
    capabilities: form.capabilities,
  };
}
