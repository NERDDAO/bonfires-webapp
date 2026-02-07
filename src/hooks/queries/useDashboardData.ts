/**
 * useDashboardData Hook
 *
 * Combines all dashboard data sources with independent loading states.
 * Each section loads independently and displays as soon as data is available.
 * Failed sections show errors without blocking other sections.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getRecentChats } from "@/lib/storage/chatHistory";
import { useUserWallet, useWalletIdentity } from "@/lib/wallet/identification";

import type {
  AgentInfo,
  DataRoomInfo,
  DataRoomSubscription,
  HyperBlogInfo,
} from "@/types/api";
import type {
  DashboardData,
  DashboardSectionState,
  RecentChatSummary,
} from "@/types/dashboard";
import type { PaymentTransaction, WalletState } from "@/types/web3";

import { useAgentsQuery } from "./useAgentsQuery";
import { useBonfiresQuery } from "./useBonfiresQuery";
import {
  useMyCreatedDataRooms,
  useMySubscribedDataRooms,
} from "./useDataRoomsQuery";
import { useMyHyperBlogs } from "./useHyperBlogsQuery";
import { useMyPaymentHistory } from "./usePaymentHistoryQuery";

/**
 * useDashboardData Hook
 *
 * Combines all dashboard data sources with independent loading states.
 * Each section loads independently and displays as soon as data is available.
 * Failed sections show errors without blocking other sections.
 */

/**
 * Create a section state object from React Query result
 */
function createSectionState<T>(
  data: T | undefined,
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  refetch: () => void
): DashboardSectionState<T> {
  return {
    data: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for fetching recent chats from localStorage
 * Includes agent name resolution
 */
function useRecentChatsData(
  bonfireId: string | null
): DashboardSectionState<RecentChatSummary[]> {
  const [chats, setChats] = useState<RecentChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agents for name resolution
  const { data: agentsData } = useAgentsQuery({
    bonfireId,
    enabled: !!bonfireId,
  });

  // Create agent ID to name map
  const agentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (agentsData?.agents) {
      agentsData.agents.forEach((agent: AgentInfo) => {
        map.set(agent.id, agent.name);
      });
    }
    return map;
  }, [agentsData?.agents]);

  // Load chats from localStorage
  const loadChats = useCallback(() => {
    setIsLoading(true);
    try {
      const recentChats = getRecentChats();
      const chatsWithNames: RecentChatSummary[] = recentChats.map((chat) => ({
        agentId: chat.agentId,
        agentName:
          agentNameMap.get(chat.agentId) ?? `Agent ${chat.agentId.slice(0, 8)}`,
        lastMessage: chat.lastMessage,
        lastUpdated: chat.lastUpdated,
        messageCount: chat.messageCount,
      }));
      setChats(chatsWithNames);
    } finally {
      setIsLoading(false);
    }
  }, [agentNameMap]);

  // Initial load and on agent data change
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    data: chats,
    isLoading,
    isError: false,
    error: null,
    refetch: loadChats,
  };
}

/**
 * Main dashboard data hook
 * Aggregates all data sources with independent loading states
 *
 * @param bonfireIdOverride - When provided (e.g. from subdomain context), use for bonfire-scoped data
 */
export function useDashboardData(
  bonfireIdOverride?: string | null
): DashboardData {
  const walletAddress = useUserWallet();
  const walletState = useWalletIdentity();

  // Fetch first bonfire for agent name resolution in chats (or use override from subdomain)
  const { data: bonfiresData } = useBonfiresQuery();
  const firstBonfireId =
    bonfireIdOverride ?? bonfiresData?.bonfires?.[0]?.id ?? null;

  // Recent chats from localStorage (no wallet required)
  const recentChats = useRecentChatsData(firstBonfireId);

  // Created data rooms (requires wallet)
  const createdDataRoomsQuery = useMyCreatedDataRooms(walletAddress);
  const createdDataRooms = createSectionState<DataRoomInfo[]>(
    createdDataRoomsQuery.data?.datarooms,
    createdDataRoomsQuery.isLoading,
    createdDataRoomsQuery.isError,
    createdDataRoomsQuery.error,
    createdDataRoomsQuery.refetch
  );

  // Subscribed data rooms (requires wallet)
  const subscribedDataRoomsQuery = useMySubscribedDataRooms(walletAddress);
  // Note: The API returns DataRoomListResponse, we need to extract subscriptions
  // For now we'll use the datarooms as a proxy - the backend should return subscription info
  const subscribedDataRooms = createSectionState<DataRoomSubscription[]>(
    // Transform datarooms to subscriptions placeholder
    subscribedDataRoomsQuery.data?.datarooms?.map((dr: DataRoomInfo) => ({
      id: `sub-${dr.id}`,
      dataroom_id: dr.id,
      user_wallet: walletAddress ?? "",
      queries_remaining: dr.query_limit, // Placeholder - backend should provide actual subscription data
      expires_at: new Date(
        Date.now() + dr.expiration_days * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: "active" as const,
      created_at: dr.created_at,
    })) ?? [],
    subscribedDataRoomsQuery.isLoading,
    subscribedDataRoomsQuery.isError,
    subscribedDataRoomsQuery.error,
    subscribedDataRoomsQuery.refetch
  );

  // HyperBlogs created by user (requires wallet)
  const hyperBlogsQuery = useMyHyperBlogs(walletAddress);
  const hyperBlogs = createSectionState<HyperBlogInfo[]>(
    hyperBlogsQuery.data?.hyperblogs,
    hyperBlogsQuery.isLoading,
    hyperBlogsQuery.isError,
    hyperBlogsQuery.error,
    hyperBlogsQuery.refetch
  );

  // Payment history (requires wallet)
  const paymentHistoryQuery = useMyPaymentHistory(walletAddress);
  const paymentHistory = createSectionState<PaymentTransaction[]>(
    paymentHistoryQuery.data?.transactions,
    paymentHistoryQuery.isLoading,
    paymentHistoryQuery.isError,
    paymentHistoryQuery.error,
    paymentHistoryQuery.refetch
  );

  // Documents - currently null as we need a bonfire selector
  // In a real implementation, we'd aggregate across bonfires or let user select
  const documents: DashboardSectionState<never[]> = {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => {},
  };

  // Wallet state
  const wallet: WalletState = {
    address: walletState.address,
    chainId: walletState.chainId,
    balance: walletState.balance,
    isConnected: walletState.isConnected,
    isConnecting: walletState.isConnecting,
  };

  return {
    recentChats,
    createdDataRooms,
    subscribedDataRooms,
    documents,
    hyperBlogs,
    paymentHistory,
    wallet,
  };
}

/**
 * Hook for checking if any dashboard section requires wallet
 */
export function useDashboardRequiresWallet(): boolean {
  const walletAddress = useUserWallet();
  return !walletAddress;
}

/**
 * Hook for refreshing all dashboard data
 */
export function useRefreshDashboard(): () => void {
  const data = useDashboardData();

  return useCallback(() => {
    data.recentChats.refetch();
    data.createdDataRooms.refetch();
    data.subscribedDataRooms.refetch();
    data.hyperBlogs.refetch();
    data.paymentHistory.refetch();
  }, [data]);
}
