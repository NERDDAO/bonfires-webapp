/**
 * useLocalStorage Hook
 * Persistent state management using localStorage
 */
"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useLocalStorage Hook
 * Persistent state management using localStorage
 */

/**
 * Storage keys for the application
 */
export const STORAGE_KEYS = {
  // Agent/Bonfire selections (per feature)
  GRAPH_BONFIRE: "delve.graph.bonfireId",
  GRAPH_AGENT: "delve.graph.agentId",
  DOCUMENTS_BONFIRE: "delve.documents.bonfireId",
  CHAT_AGENT: "delve.chat.agentId",
  DELVE_BONFIRE: "delve.delve.bonfireId",

  // Chat history (per agent)
  CHAT_HISTORY: "delve.chat.history",

  // UI preferences
  THEME: "delve.theme",
  LAST_ROUTE: "delve.lastRoute",

  // Dashboard state
  DASHBOARD_LAYOUT: "delve.dashboard.layout",
} as const;

/**
 * Hook for managing state with localStorage persistence
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for useState-like API
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync across tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Helper to get a value from localStorage without a hook
 */
export function getStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Helper to set a value in localStorage without a hook
 */
export function setStorageValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
}

export default useLocalStorage;
