/**
 * Fetch x402 payment configuration from the server.
 *
 * Returns the payTo address, network, token contract, and EIP-712 domain
 * params so the client signs payments to the correct recipient.
 */

export interface ServerPaymentConfig {
  payTo: string;
  network: string;
  scheme: string;
  asset: string;
  token: string;
  maxTimeoutSeconds: number;
  extra: {
    assetTransferMethod: string;
    name: string;
    version: string;
  };
}

let cachedConfig: ServerPaymentConfig | null = null;
let cachedKey: string | null = null;

/**
 * Fetch payment config. When hackathonTrackId or dataroomId is provided,
 * payTo is overridden to the track's escrow address so payments fund
 * the hackathon prize pool.
 */
export async function fetchPaymentConfig(
  hackathonTrackId?: string,
  dataroomId?: string,
): Promise<ServerPaymentConfig> {
  const cacheKey = hackathonTrackId ?? dataroomId ?? null;

  // Return cached if same context
  if (cachedConfig && cachedKey === cacheKey) {
    return cachedConfig;
  }

  const params = new URLSearchParams();
  if (hackathonTrackId) params.set("hackathon_track_id", hackathonTrackId);
  if (dataroomId) params.set("dataroom_id", dataroomId);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`/api/payments/config${qs}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch payment config: ${response.status}`);
  }

  const body = await response.json();
  // The proxy wraps in {data: ...} via createSuccessResponse
  cachedConfig = (body.data ?? body) as ServerPaymentConfig;
  cachedKey = cacheKey;
  return cachedConfig;
}

export function clearPaymentConfigCache(): void {
  cachedConfig = null;
  cachedKey = null;
}
