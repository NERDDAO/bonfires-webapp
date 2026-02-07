/**
 * useSubscribeDataRoom Hook
 *
 * React Query mutation hook for subscribing to data rooms.
 * Handles payment verification flow.
 */
"use client";

import type {
  DataRoomSubscribeRequest,
  DataRoomSubscription,
  PaymentVerifyResponse,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { dataRoomsQueryKey } from "@/hooks/queries";

import { apiClient } from "@/lib/api/client";

/**
 * useSubscribeDataRoom Hook
 *
 * React Query mutation hook for subscribing to data rooms.
 * Handles payment verification flow.
 */

interface SubscribeParams {
  /** Data room ID to subscribe to */
  dataroomId: string;
  /** Payment header from x402 protocol */
  paymentHeader: string;
  /** User's wallet address */
  userWallet: string;
}

interface SubscribeResult {
  subscription: DataRoomSubscription;
  payment: PaymentVerifyResponse;
  success: boolean;
  message?: string;
}

/**
 * Hook for subscribing to a data room with payment
 */
export function useSubscribeDataRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubscribeParams): Promise<SubscribeResult> => {
      const { dataroomId, paymentHeader, userWallet } = params;

      // First verify the payment
      const paymentResponse = await apiClient.post<PaymentVerifyResponse>(
        "/api/payments/verify",
        {
          payment_header: paymentHeader,
          resource_type: "dataroom",
          resource_id: dataroomId,
        }
      );

      if (!paymentResponse.verified) {
        throw new Error(paymentResponse.error ?? "Payment verification failed");
      }

      // Then subscribe to the data room
      const subscribeRequest: DataRoomSubscribeRequest = {
        payment_header: paymentHeader,
        user_wallet: userWallet,
      };

      const subscribeResponse = await apiClient.post<{
        subscription: DataRoomSubscription;
        success: boolean;
        message?: string;
      }>(`/api/datarooms/${dataroomId}/subscribe`, subscribeRequest);

      if (!subscribeResponse.success) {
        throw new Error(subscribeResponse.message ?? "Subscription failed");
      }

      return {
        subscription: subscribeResponse.subscription,
        payment: paymentResponse,
        success: true,
        message: "Successfully subscribed to data room",
      };
    },
    onSuccess: (_data, variables) => {
      // Invalidate data room queries
      queryClient.invalidateQueries({
        queryKey: ["datarooms", variables.dataroomId],
      });

      // Invalidate user's subscribed data rooms
      queryClient.invalidateQueries({
        queryKey: dataRoomsQueryKey({ subscriberWallet: variables.userWallet }),
      });

      // Invalidate subscriptions list
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
    },
  });
}

/**
 * Hook for checking subscription status
 */
export function useCheckSubscription() {
  return useMutation({
    mutationFn: async (params: {
      dataroomId: string;
      userWallet: string;
    }): Promise<DataRoomSubscription | null> => {
      try {
        const response = await apiClient.get<{
          subscription: DataRoomSubscription | null;
        }>(
          `/api/datarooms/${params.dataroomId}/subscription?wallet=${params.userWallet}`
        );

        return response.subscription;
      } catch {
        return null;
      }
    },
  });
}

/**
 * Hook for cancelling a subscription
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      dataroomId: string;
      subscriptionId: string;
      userWallet: string;
    }): Promise<void> => {
      await apiClient.post(`/api/datarooms/${params.dataroomId}/unsubscribe`, {
        subscription_id: params.subscriptionId,
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["datarooms", variables.dataroomId],
      });

      queryClient.invalidateQueries({
        queryKey: dataRoomsQueryKey({ subscriberWallet: variables.userWallet }),
      });

      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
    },
  });
}
