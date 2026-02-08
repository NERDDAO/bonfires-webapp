/**
 * Application Configuration
 *
 * Centralized configuration values from environment variables.
 */

interface AppConfig {
  // API Configuration (client-side)
  api: {
    baseUrl: string;
    timeout: number;
  };

  // Server-side API Configuration
  server: {
    /** Backend URL for server-side requests (prefers non-public env var) */
    backendUrl: string;
    /** Timeout for API routes (10s for Vercel Hobby plan) */
    timeout: number;
  };

  // Web3 Configuration
  web3: {
    chainId: number;
    walletConnectProjectId: string;
  };

  // Feature Flags
  features: {
    graphVisualization: boolean;
    web3Features: boolean;
    devTools: boolean;
  };

  // App Info
  app: {
    name: string;
    version: string;
    environment: "development" | "staging" | "production";
  };

  // Subdomain / host resolution
  subdomain: {
    /** Hostnames that are the app root (no subdomain). Override via NEXT_PUBLIC_APP_ROOTS. */
    appRoots: string[];
  };
}

function getConfig(): AppConfig {
  const isDev = process.env.NODE_ENV === "development";

  return {
    api: {
      baseUrl:
        process.env["NEXT_PUBLIC_DELVE_API_URL"] ?? "http://localhost:8000",
      timeout: 60000,
    },

    server: {
      // Prefer non-public env var for server-side requests
      backendUrl:
        process.env["DELVE_API_URL"] ??
        process.env["NEXT_PUBLIC_DELVE_API_URL"] ??
        "http://localhost:8000",
      // 60s timeout for Vercel Pro compatibility
      timeout: 60000,
    },

    web3: {
      chainId: parseInt(process.env["NEXT_PUBLIC_CHAIN_ID"] ?? "11124", 10),
      walletConnectProjectId:
        process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] ?? "",
    },

    features: {
      graphVisualization:
        process.env["NEXT_PUBLIC_ENABLE_GRAPH_VIZ"] !== "false",
      web3Features: process.env["NEXT_PUBLIC_ENABLE_WEB3_FEATURES"] !== "false",
      devTools: isDev,
    },

    app: {
      name: "Delve",
      version: process.env["NEXT_PUBLIC_APP_VERSION"] ?? "1.0.0",
      environment: isDev
        ? "development"
        : process.env["NEXT_PUBLIC_ENVIRONMENT"] === "staging"
          ? "staging"
          : "production",
    },

    subdomain: {
      appRoots: parseAppRoots(process.env["NEXT_PUBLIC_APP_ROOTS"]),
    },
  };
}

function parseAppRoots(env: string | undefined): string[] {
  const defaults = ["app.bonfires.ai", "staging-app.bonfires.ai"];
  const fromEnv = env?.trim()
    ? env
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : defaults;
  const vercelUrl = process.env["VERCEL_URL"]?.toLowerCase();
  if (vercelUrl && !fromEnv.includes(vercelUrl)) {
    return [...fromEnv, vercelUrl];
  }
  return fromEnv;
}

export const config = getConfig();

// Type-safe environment variable access
export function getEnvVar(
  key: string,
  defaultValue?: string
): string | undefined {
  return process.env[key] ?? defaultValue;
}

export function requireEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
