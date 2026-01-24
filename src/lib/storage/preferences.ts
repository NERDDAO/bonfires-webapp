/**
 * Local Storage Utilities for User Preferences
 *
 * Handles persistence of user selections and preferences across sessions.
 */

const STORAGE_KEYS = {
  // Agent/Bonfire selections (per feature)
  GRAPH_BONFIRE: "delve.graph.bonfireId",
  GRAPH_AGENT: "delve.graph.agentId",
  DOCUMENTS_BONFIRE: "delve.documents.bonfireId",
  CHAT_AGENT: "delve.chat.agentId",
  DELVE_BONFIRE: "delve.delve.bonfireId",

  // UI preferences
  THEME: "delve.theme",
  LAST_ROUTE: "delve.lastRoute",

  // Dashboard state
  DASHBOARD_LAYOUT: "delve.dashboard.layout",
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

interface UserPreferences {
  selectedBonfireId: string | null;
  selectedAgentId: string | null;
  theme: "light" | "dark";
  lastVisitedRoute: string;
}

/**
 * Safe localStorage getter with JSON parsing
 */
function getItem<T>(key: StorageKey, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage setter with JSON stringification
 */
function setItem<T>(key: StorageKey, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save to localStorage: ${key}`, error);
  }
}

/**
 * Remove item from localStorage
 */
function removeItem(key: StorageKey): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

// Feature-specific getters and setters

export const graphPreferences = {
  getBonfireId: () => getItem<string | null>(STORAGE_KEYS.GRAPH_BONFIRE, null),
  setBonfireId: (id: string | null) => setItem(STORAGE_KEYS.GRAPH_BONFIRE, id),

  getAgentId: () => getItem<string | null>(STORAGE_KEYS.GRAPH_AGENT, null),
  setAgentId: (id: string | null) => setItem(STORAGE_KEYS.GRAPH_AGENT, id),
};

export const documentsPreferences = {
  getBonfireId: () =>
    getItem<string | null>(STORAGE_KEYS.DOCUMENTS_BONFIRE, null),
  setBonfireId: (id: string | null) =>
    setItem(STORAGE_KEYS.DOCUMENTS_BONFIRE, id),
};

export const chatPreferences = {
  getAgentId: () => getItem<string | null>(STORAGE_KEYS.CHAT_AGENT, null),
  setAgentId: (id: string | null) => setItem(STORAGE_KEYS.CHAT_AGENT, id),
};

export const delvePreferences = {
  getBonfireId: () => getItem<string | null>(STORAGE_KEYS.DELVE_BONFIRE, null),
  setBonfireId: (id: string | null) => setItem(STORAGE_KEYS.DELVE_BONFIRE, id),
};

export const uiPreferences = {
  getTheme: () => getItem<"light" | "dark">(STORAGE_KEYS.THEME, "dark"),
  setTheme: (theme: "light" | "dark") => setItem(STORAGE_KEYS.THEME, theme),

  getLastRoute: () => getItem<string>(STORAGE_KEYS.LAST_ROUTE, "/"),
  setLastRoute: (route: string) => setItem(STORAGE_KEYS.LAST_ROUTE, route),
};

/**
 * Clear all Delve preferences from localStorage
 */
export function clearAllPreferences(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeItem(key);
  });
}

// Export storage keys for external use
export { STORAGE_KEYS };
export type { UserPreferences };
