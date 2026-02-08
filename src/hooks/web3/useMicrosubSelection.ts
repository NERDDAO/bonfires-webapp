"use client";

/**
 * useMicrosubSelection Hook
 *
 * Manages microsub (subscription) selection for Web3 payment features.
 * Handles fetching, validation, and selection of user subscriptions.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

export interface MicrosubInfo {
  tx_hash: string;
  agent_id: string;
  agent_name?: string;
  bonfire_id?: string;
  bonfire_name?: string;
  description?: string;
  system_prompt?: string;
  center_node_uuid?: string;
  queries_remaining: number;
  total_queries: number;
  expires_at: string;
  is_expired: boolean;
  is_exhausted: boolean;
  is_valid: boolean;
  created_at: string;
  dataroom_id?: string;
}

export interface MicrosubInfoWithDisabled extends MicrosubInfo {
  disabled: boolean;
}

interface UseMicrosubSelectionConfig {
  walletAddress?: string | null;
  autoSelectValid?: boolean;
  onInvalidSelection?: (reason: "expired" | "exhausted" | "invalid") => void;
  onlyDataRooms?: boolean;
}

interface MicrosubListResponse {
  microsubs: MicrosubInfo[];
  count: number;
}

export function useMicrosubSelection(config?: UseMicrosubSelectionConfig) {
  const [availableMicrosubs, setAvailableMicrosubs] = useState<
    MicrosubInfoWithDisabled[]
  >([]);
  const [selectedMicrosub, setSelectedMicrosub] =
    useState<MicrosubInfoWithDisabled | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

  // Fetch microsubs when wallet address changes
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    // Clear selection when wallet changes
    setSelectedMicrosub(null);

    if (!config?.walletAddress) {
      setAvailableMicrosubs([]);
      setLoading(false);
      setError(null);
      return () => {
        mounted = false;
        abortController.abort();
      };
    }

    const requestWalletAddress = config.walletAddress;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      wallet_address: config.walletAddress,
    });
    if (config?.onlyDataRooms) {
      params.set("only_data_rooms", "true");
    }

    fetch(`/api/microsubs?${params.toString()}`, {
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load microsubs: ${res.statusText}`);
        return res.json();
      })
      .then((data: MicrosubListResponse) => {
        if (!mounted || requestWalletAddress !== config?.walletAddress) return;

        const microsubsWithDisabled: MicrosubInfoWithDisabled[] = (
          data.microsubs || []
        ).map((m) => ({
          ...m,
          disabled: m.is_expired || m.is_exhausted || !m.is_valid,
        }));

        setAvailableMicrosubs(microsubsWithDisabled);

        if (config?.autoSelectValid) {
          const firstValid = microsubsWithDisabled.find((m) => !m.disabled);
          if (firstValid) {
            setSelectedMicrosub(firstValid);
          }
        }
      })
      .catch((err) => {
        if (!mounted || err.name === "AbortError") return;
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load microsubs";
        setError(errorMsg);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [
    config?.walletAddress,
    config?.autoSelectValid,
    config?.onlyDataRooms,
    refetchTrigger,
  ]);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMicrosub(null);
  }, []);

  const validateSelectedMicrosub = useCallback(() => {
    if (selectedMicrosub === null) {
      return { isValid: true as const };
    }

    let reason: "expired" | "exhausted" | "invalid" | undefined;

    if (selectedMicrosub.is_expired === true) {
      reason = "expired";
    } else if (selectedMicrosub.is_exhausted === true) {
      reason = "exhausted";
    } else if (selectedMicrosub.is_valid === false) {
      reason = "invalid";
    }

    if (reason) {
      config?.onInvalidSelection?.(reason);
      return { isValid: false as const, reason };
    }

    return { isValid: true as const };
  }, [selectedMicrosub, config]);

  const selectMicrosub = useCallback(
    (tx_hash: string | null) => {
      if (tx_hash === null) {
        setSelectedMicrosub(null);
        return;
      }
      const microsub = availableMicrosubs.find((m) => m.tx_hash === tx_hash);

      if (!microsub || microsub.disabled) {
        return;
      }

      setSelectedMicrosub(microsub);
    },
    [availableMicrosubs]
  );

  const validMicrosubs = useMemo(
    () => availableMicrosubs.filter((m) => !m.disabled),
    [availableMicrosubs]
  );

  const expiredMicrosubs = useMemo(
    () => availableMicrosubs.filter((m) => m.is_expired === true),
    [availableMicrosubs]
  );

  const exhaustedMicrosubs = useMemo(
    () => availableMicrosubs.filter((m) => m.is_exhausted === true),
    [availableMicrosubs]
  );

  const hasValidMicrosubs = useMemo(
    () => validMicrosubs.length > 0,
    [validMicrosubs]
  );

  const hasAnyMicrosubs = useMemo(
    () => availableMicrosubs.length > 0,
    [availableMicrosubs]
  );

  return {
    availableMicrosubs,
    selectedMicrosub,
    loading,
    error,
    validMicrosubs,
    expiredMicrosubs,
    exhaustedMicrosubs,
    hasValidMicrosubs,
    hasAnyMicrosubs,
    selectMicrosub,
    clearSelection,
    validateSelectedMicrosub,
    refetch,
  } as const;
}
