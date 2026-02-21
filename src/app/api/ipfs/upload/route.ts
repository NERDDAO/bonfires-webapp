/**
 * IPFS Upload API Route
 *
 * POST /api/ipfs/upload
 *
 * Receives bonfire form data, builds ERC-8004 metadata JSON,
 * and uploads it to Pinata IPFS. Returns the IPFS URI.
 *
 * PINATA_JWT is a server-only env var — never exposed to the browser.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  parseJsonBody,
} from "@/lib/api/server-utils";
import { buildErc8004Metadata } from "@/lib/erc8004/metadata";

const PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

interface UploadRequestBody {
  name?: string;
  description?: string;
  capabilities?: string[];
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function POST(request: NextRequest) {
  const { data: body, error: parseError } =
    await parseJsonBody<UploadRequestBody>(request);

  if (parseError) {
    return createErrorResponse(parseError, 400);
  }

  if (!body?.name?.trim()) {
    return createErrorResponse("name is required", 400);
  }
  if (!body?.description?.trim()) {
    return createErrorResponse("description is required", 400);
  }

  const pinataJwt = process.env["PINATA_JWT"];
  if (!pinataJwt) {
    console.error("[IPFS Upload] PINATA_JWT environment variable is not set");
    return createErrorResponse(
      "IPFS upload is not configured. Please contact support.",
      500
    );
  }

  const metadata = buildErc8004Metadata({
    agentName: body.name.trim(),
    description: body.description.trim(),
    capabilities: body.capabilities ?? [],
  });

  try {
    const pinataResponse = await fetch(PINATA_PIN_JSON_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `bonfire-${body.name.trim().toLowerCase().replace(/\s+/g, "-")}`,
        },
      }),
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text().catch(() => "Unknown error");
      console.error(
        `[IPFS Upload] Pinata returned ${pinataResponse.status}: ${errorText}`
      );
      return createErrorResponse(
        "Failed to upload metadata to IPFS. Please try again.",
        500
      );
    }

    const pinataData = (await pinataResponse.json()) as PinataResponse;

    return createSuccessResponse({
      ipfs_uri: `ipfs://${pinataData.IpfsHash}`,
    });
  } catch (error) {
    console.error("[IPFS Upload] Exception:", error);
    return createErrorResponse(
      "Failed to upload metadata to IPFS. Please try again.",
      500
    );
  }
}

export function OPTIONS() {
  return handleCorsOptions();
}
