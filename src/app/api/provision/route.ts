/**
 * /api/provision — Next.js proxy routes
 *
 * POST: Validates required fields and proxies to backend POST /provision
 *       using the server-side API_KEY. The key is never exposed to the browser.
 *
 * GET:  Validates wallet_address query param and proxies to backend
 *       GET /provision?wallet_address=... Returns a non-sensitive record list.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  extractQueryParams,
  handleCorsOptions,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";
import type { ProvisionedBonfireRecord, ProvisionResult } from "@/types";

interface ProvisionRequestBody {
  tx_hash?: string;
  wallet_address?: string;
  agent_name?: string;
  description?: string;
  capabilities?: string[];
}

interface BackendProvisionResponse {
  bonfire_id: string;
  agent_id: string;
  api_key_id: string;
  erc8004_bonfire_id: number;
  ipfs_uri: string;
  api_key_last4: string;
  agent_name: string;
}

export async function POST(request: NextRequest) {
  const { data: body, error: parseError } =
    await parseJsonBody<ProvisionRequestBody>(request);

  if (parseError) {
    return createErrorResponse(parseError, 400);
  }

  if (!body?.tx_hash?.trim()) {
    return createErrorResponse("tx_hash is required", 400);
  }
  if (!body?.wallet_address?.trim()) {
    return createErrorResponse("wallet_address is required", 400);
  }
  if (!body?.agent_name?.trim()) {
    return createErrorResponse("agent_name is required", 400);
  }
  if (!body?.description?.trim()) {
    return createErrorResponse("description is required", 400);
  }

  const apiKey = process.env["API_KEY"];
  if (!apiKey) {
    console.error("[Provision] API_KEY environment variable is not set");
    return createErrorResponse("Provisioning is not configured", 500);
  }

  const result = await proxyToBackend<BackendProvisionResponse>("/provision", {
    method: "POST",
    body: {
      tx_hash: body.tx_hash.trim(),
      wallet_address: body.wallet_address.trim(),
      agent_name: body.agent_name.trim(),
      description: body.description.trim(),
      capabilities: body.capabilities ?? [],
    },
    headers: { Authorization: `Bearer ${apiKey}` },
    includeAuth: false,
  });

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Provision request failed",
      result.status,
      result.error?.details
    );
  }

  const data = result.data!;
  const response: ProvisionResult = {
    bonfireId: data.bonfire_id,
    agentId: data.agent_id,
    erc8004BonfireId: data.erc8004_bonfire_id,
    apiKeyLast4: data.api_key_last4,
    ipfsUri: data.ipfs_uri,
  };

  return createSuccessResponse(response);
}

export async function GET(request: NextRequest) {
  const { wallet_address: walletAddress } = extractQueryParams(request, [
    "wallet_address",
  ]);

  if (!walletAddress?.trim()) {
    return createErrorResponse("wallet_address query parameter is required", 400);
  }

  const result = await proxyToBackend<ProvisionedBonfireRecord[]>("/provision", {
    method: "GET",
    queryParams: { wallet_address: walletAddress.trim() },
    includeAuth: false,
  });

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch provisioned bonfires",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data ?? []);
}

export function OPTIONS() {
  return handleCorsOptions();
}
