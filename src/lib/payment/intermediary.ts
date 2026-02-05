const DEFAULT_INTERMEDIARY = "0x0000000000000000000000000000000000000000";

const INTERMEDIARY_BY_NETWORK_PAIR: Record<string, string> = {
  "base->base": "0xfeb1F8F7F9ff37B94D14c88DE9282DA56b3B1Cb1",
  "solana->solana": "DoVABZK8r9793SuR3powWCTdr2wVqwhueV9DuZu97n2L",
  "base->solana": "0x931Cc2F11C36C34b4312496f470Ff21474F2fA42",
  "solana->base": "AGm6Dzvd5evgWGGZtyvJE7cCTg7DKC9dNmwdubJg2toq",
};

interface ResolveIntermediaryParams {
  sourceNetwork: string;
  destinationNetwork: string;
  override?: string | null;
}

function normalizeNetwork(network: string): string {
  const normalized = network.trim().toLowerCase();
  if (normalized.startsWith("base")) {
    return "base";
  }
  if (normalized.startsWith("solana")) {
    return "solana";
  }
  return normalized;
}

export function resolveIntermediaryAddress({
  sourceNetwork,
  destinationNetwork,
  override,
}: ResolveIntermediaryParams): string {
  if (override && override.trim()) {
    return override.trim();
  }

  const pair = `${normalizeNetwork(sourceNetwork)}->${normalizeNetwork(destinationNetwork)}`;
  return INTERMEDIARY_BY_NETWORK_PAIR[pair] ?? DEFAULT_INTERMEDIARY;
}
