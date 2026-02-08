/**
 * BonfireSelector Component
 *
 * A dropdown selector for choosing a bonfire with localStorage persistence.
 * Used across multiple features (Documents, Graph, etc.) with feature-specific storage keys.
 */
"use client";

import { useCallback, useEffect, useState } from "react";

import { useBonfiresQuery } from "@/hooks";
import type { BonfireInfo } from "@/types";

/**
 * BonfireSelector Component
 *
 * A dropdown selector for choosing a bonfire with localStorage persistence.
 * Used across multiple features (Documents, Graph, etc.) with feature-specific storage keys.
 */

interface BonfireSelectorProps {
  /** Currently selected bonfire ID */
  selectedBonfireId: string | null;
  /** Callback when selection changes */
  onBonfireChange: (bonfire: BonfireInfo | null) => void;
  /** Storage key for localStorage persistence (e.g., "documents", "graph") */
  storageKey?: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disable the selector */
  disabled?: boolean;
  /** Show loading skeleton when data is loading */
  showSkeleton?: boolean;
}

const STORAGE_PREFIX = "delve";

/**
 * Get localStorage key for a feature
 */
function getStorageKey(feature: string): string {
  return `${STORAGE_PREFIX}.${feature}.bonfireId`;
}

/**
 * Load bonfire ID from localStorage
 */
function loadPersistedBonfireId(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(getStorageKey(storageKey));
  } catch {
    return null;
  }
}

/**
 * Save bonfire ID to localStorage
 */
function persistBonfireId(storageKey: string, bonfireId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(storageKey);
    if (bonfireId) {
      localStorage.setItem(key, bonfireId);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Silently fail on storage errors
  }
}

export function BonfireSelector({
  selectedBonfireId,
  onBonfireChange,
  storageKey = "default",
  placeholder = "Select a bonfire",
  className = "",
  disabled = false,
  showSkeleton = true,
}: BonfireSelectorProps) {
  const { data, isLoading, error } = useBonfiresQuery();
  const bonfires = data?.bonfires ?? [];
  const [initialized, setInitialized] = useState(false);

  // Initialize selection from localStorage on mount
  useEffect(() => {
    if (initialized || isLoading || bonfires.length === 0) return;

    const persistedId = loadPersistedBonfireId(storageKey);
    if (persistedId && !selectedBonfireId) {
      const bonfire = bonfires.find((b) => b.id === persistedId);
      if (bonfire) {
        onBonfireChange(bonfire);
      }
    }
    setInitialized(true);
  }, [
    bonfires,
    isLoading,
    initialized,
    storageKey,
    selectedBonfireId,
    onBonfireChange,
  ]);

  // Handle selection change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const bonfireId = e.target.value;
      const bonfire = bonfireId
        ? (bonfires.find((b) => b.id === bonfireId) ?? null)
        : null;

      persistBonfireId(storageKey, bonfireId || null);
      onBonfireChange(bonfire);
    },
    [bonfires, storageKey, onBonfireChange]
  );

  // Loading state
  if (isLoading && showSkeleton) {
    return <div className={`skeleton h-12 w-full rounded-lg ${className}`} />;
  }

  // Error state
  if (error) {
    return (
      <div className={`alert alert-error ${className}`}>
        <span>Failed to load bonfires</span>
      </div>
    );
  }

  return (
    <select
      className={`select select-bordered w-full ${className}`}
      value={selectedBonfireId ?? ""}
      onChange={handleChange}
      disabled={disabled || isLoading}
    >
      <option value="">{placeholder}</option>
      {bonfires.map((bonfire) => (
        <option key={bonfire.id} value={bonfire.id}>
          {bonfire.name}
          {bonfire.description && ` - ${bonfire.description}`}
        </option>
      ))}
    </select>
  );
}

/**
 * Hook for managing bonfire selection with localStorage persistence
 */
export function useBonfireSelection(storageKey: string) {
  const [selectedBonfire, setSelectedBonfire] = useState<BonfireInfo | null>(
    null
  );
  const { data, isLoading } = useBonfiresQuery();
  const bonfires = data?.bonfires ?? [];

  // Initialize from localStorage
  useEffect(() => {
    if (isLoading || bonfires.length === 0) return;

    const persistedId = loadPersistedBonfireId(storageKey);
    if (persistedId) {
      const bonfire = bonfires.find((b) => b.id === persistedId);
      if (bonfire) {
        setSelectedBonfire(bonfire);
      }
    }
  }, [bonfires, isLoading, storageKey]);

  const handleBonfireChange = useCallback(
    (bonfire: BonfireInfo | null) => {
      setSelectedBonfire(bonfire);
      persistBonfireId(storageKey, bonfire?.id ?? null);
    },
    [storageKey]
  );

  return {
    selectedBonfire,
    selectedBonfireId: selectedBonfire?.id ?? null,
    onBonfireChange: handleBonfireChange,
    bonfires,
    isLoading,
  };
}
