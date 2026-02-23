/**
 * IPFS Image Upload API Route
 *
 * POST /api/ipfs/upload-image
 *
 * Accepts a single image file via multipart/form-data, validates it,
 * and pins it to Pinata IPFS. Returns the IPFS URI for the image.
 *
 * PINATA_JWT is a server-only env var -- never exposed to the browser.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
} from "@/lib/api/server-utils";

const PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function POST(request: NextRequest) {
  const pinataJwt = process.env["PINATA_JWT"];
  if (!pinataJwt) {
    console.error("[IPFS Image] PINATA_JWT environment variable is not set");
    return createErrorResponse(
      "IPFS upload is not configured. Please contact support.",
      500
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return createErrorResponse("Invalid multipart form data", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return createErrorResponse("'file' field is required and must be a file", 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return createErrorResponse(
      `Unsupported file type: ${file.type}. Allowed: PNG, JPEG, GIF, WebP, SVG.`,
      400
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return createErrorResponse(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`,
      400
    );
  }

  const pinataForm = new FormData();
  pinataForm.append("file", file, file.name);
  pinataForm.append(
    "pinataMetadata",
    JSON.stringify({ name: `bonfire-image-${file.name}` })
  );

  try {
    const pinataResponse = await fetch(PINATA_PIN_FILE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${pinataJwt}` },
      body: pinataForm,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text().catch(() => "Unknown error");
      console.error(
        `[IPFS Image] Pinata returned ${pinataResponse.status}: ${errorText}`
      );
      return createErrorResponse(
        "Failed to upload image to IPFS. Please try again.",
        500
      );
    }

    const pinataData = (await pinataResponse.json()) as PinataResponse;

    return createSuccessResponse({
      ipfs_uri: `ipfs://${pinataData.IpfsHash}`,
      ipfs_hash: pinataData.IpfsHash,
      gateway_url: `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`,
    });
  } catch (error) {
    console.error("[IPFS Image] Exception:", error);
    return createErrorResponse(
      "Failed to upload image to IPFS. Please try again.",
      500
    );
  }
}

export function OPTIONS() {
  return handleCorsOptions();
}
