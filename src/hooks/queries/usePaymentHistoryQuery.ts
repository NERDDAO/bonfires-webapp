/**
 * usePaymentHistoryQuery Hook
 *
 * React Query hook for fetching payment history for a wallet address.
 * Used in the dashboard to show user's payment transactions.
 */
"use client";

import type {
  PaymentHistoryResponse,
  PaymentTransaction,
  PaymentType,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/**
 * usePaymentHistoryQuery Hook
 *
 * React Query hook for fetching payment history for a wallet address.
 * Used in the dashboard to show user's payment transactions.
 */

interface UsePaymentHistoryQueryParams {
  /** User's wallet address (required) */
  userWallet: string | null;
  /** Filter by payment type */
  type?: PaymentType;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Generate query key for payment history
 */
export function paymentHistoryQueryKey(params: UsePaymentHistoryQueryParams) {
  return [
    "payments",
    "history",
    {
      userWallet: params.userWallet,
      type: params.type ?? null,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  ] as const;
}

/**
 * Build query string from params
 */
function buildQueryString(params: UsePaymentHistoryQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.userWallet) {
    searchParams.set("user_wallet", params.userWallet);
  }
  if (params.type) {
    searchParams.set("type", params.type);
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.offset) {
    searchParams.set("offset", String(params.offset));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetch payment history for a wallet address
 */
export function usePaymentHistoryQuery(params: UsePaymentHistoryQueryParams) {
  const { enabled = true, ...filterParams } = params;

  return useQuery({
    queryKey: paymentHistoryQueryKey(filterParams),
    queryFn: () => {
      const queryString = buildQueryString(filterParams);
      return apiClient.get<PaymentHistoryResponse>(
        `/api/payments/history${queryString}`
      );
    },
    enabled: enabled && !!filterParams.userWallet,
    staleTime: 2 * 60 * 1000, // 2 minutes - payments update frequently
  });
}

/**
 * Fetch all payment history for a wallet (convenience wrapper)
 */
export function useMyPaymentHistory(walletAddress: string | null) {
  return usePaymentHistoryQuery({
    userWallet: walletAddress,
    enabled: !!walletAddress,
  });
}

/**
 * Fetch payment history filtered by type
 */
export function usePaymentHistoryByType(
  walletAddress: string | null,
  type: PaymentType
) {
  return usePaymentHistoryQuery({
    userWallet: walletAddress,
    type,
    enabled: !!walletAddress,
  });
}
