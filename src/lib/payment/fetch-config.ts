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

export async function fetchPaymentConfig(): Promise<ServerPaymentConfig> {
  if (cachedConfig) return cachedConfig;

  // Use the Next.js API route to avoid CORS (server-side proxy)
  const response = await fetch("/api/payments/config");
  if (!response.ok) {
    throw new Error(`Failed to fetch payment config: ${response.status}`);
  }

  const body = await response.json();
  // The proxy wraps in {data: ...} via createSuccessResponse
  cachedConfig = (body.data ?? body) as ServerPaymentConfig;
  return cachedConfig;
}

export function clearPaymentConfigCache(): void {
  cachedConfig = null;
}
