/**
 * Application Configuration
 *
 * Centralized configuration values from environment variables.
 */

interface AppConfig {
  // API Configuration
  api: {
    baseUrl: string;
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
}

function getConfig(): AppConfig {
  const isDev = process.env.NODE_ENV === "development";

  return {
    api: {
      baseUrl:
        process.env["NEXT_PUBLIC_DELVE_API_URL"] ?? "http://localhost:8000",
      timeout: 30000,
    },

    web3: {
      chainId: parseInt(process.env["NEXT_PUBLIC_CHAIN_ID"] ?? "11124", 10),
      walletConnectProjectId:
        process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] ?? "",
    },

    features: {
      graphVisualization:
        process.env["NEXT_PUBLIC_ENABLE_GRAPH_VIZ"] !== "false",
      web3Features:
        process.env["NEXT_PUBLIC_ENABLE_WEB3_FEATURES"] !== "false",
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
  };
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
