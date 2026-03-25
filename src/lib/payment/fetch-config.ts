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
let cachedTrackId: string | null = null;

/**
 * Fetch payment config. When hackathonTrackId is provided, payTo is overridden
 * to the track's escrow address so payments fund the hackathon prize pool.
 */
export async function fetchPaymentConfig(
  hackathonTrackId?: string,
): Promise<ServerPaymentConfig> {
  // Return cached if same context
  if (cachedConfig && cachedTrackId === (hackathonTrackId ?? null)) {
    return cachedConfig;
  }

  const params = hackathonTrackId
    ? `?hackathon_track_id=${encodeURIComponent(hackathonTrackId)}`
    : "";
  const response = await fetch(`/api/payments/config${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch payment config: ${response.status}`);
  }

  const body = await response.json();
  // The proxy wraps in {data: ...} via createSuccessResponse
  cachedConfig = (body.data ?? body) as ServerPaymentConfig;
  cachedTrackId = hackathonTrackId ?? null;
  return cachedConfig;
}

export function clearPaymentConfigCache(): void {
  cachedConfig = null;
  cachedTrackId = null;
}
