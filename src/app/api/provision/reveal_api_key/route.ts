/**
 * POST /api/provision/reveal_api_key
 *
 * Returns the raw API key after verifying wallet ownership via EIP-191 signature.
 * Proxies to backend POST /provision/reveal_api_key.
 *
 * Body: { tx_hash, nonce, signature }
 * Returns: { api_key } on success, 403 if the signer does not match.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";

interface RevealApiKeyRequestBody {
  tx_hash?: string;
  nonce?: string;
  signature?: string;
}

interface RevealApiKeyResponse {
  api_key: string;
}

export async function POST(request: NextRequest) {
  const { data: body, error: parseError } =
    await parseJsonBody<RevealApiKeyRequestBody>(request);

  if (parseError) {
    return createErrorResponse(parseError, 400);
  }

  if (!body?.tx_hash?.trim()) {
    return createErrorResponse("tx_hash is required", 400);
  }
  if (!body?.nonce?.trim()) {
    return createErrorResponse("nonce is required", 400);
  }
  if (!body?.signature?.trim()) {
    return createErrorResponse("signature is required", 400);
  }

  const result = await proxyToBackend<RevealApiKeyResponse>(
    "/provision/reveal_api_key",
    {
      method: "POST",
      body: {
        tx_hash: body.tx_hash.trim(),
        nonce: body.nonce.trim(),
        signature: body.signature.trim(),
      },
      includeAuth: false,
    }
  );

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to reveal API key",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data!);
}

export function OPTIONS() {
  return handleCorsOptions();
}
