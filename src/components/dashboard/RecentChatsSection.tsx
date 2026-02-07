/**
 * RecentChatsSection Component
 *
 * Displays recent chat conversations from localStorage.
 * Shows per-agent chat history with quick action to continue chat.
 */
"use client";

import Link from "next/link";

import type {
  DashboardSectionState,
  RecentChatSummary,
} from "@/types/dashboard";

import { DashboardSection } from "./DashboardSection";

/**
 * RecentChatsSection Component
 *
 * Displays recent chat conversations from localStorage.
 * Shows per-agent chat history with quick action to continue chat.
 */

interface RecentChatsSectionProps {
  data: DashboardSectionState<RecentChatSummary[]>;
}

/**
 * Format relative time for display
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Truncate message for preview
 */
function truncateMessage(message: string, maxLength = 60): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength).trim() + "...";
}

export function RecentChatsSection({ data }: RecentChatsSectionProps) {
  const chats = data.data ?? [];
  const isEmpty = !data.isLoading && !data.isError && chats.length === 0;

  return (
    <DashboardSection
      title="Recent Chats"
      icon="💬"
      isLoading={data.isLoading}
      isError={data.isError}
      errorMessage={data.error?.message ?? "Failed to load recent chats"}
      onRetry={data.refetch}
      isEmpty={isEmpty}
      emptyMessage="No recent chats. Start a conversation with an agent!"
      skeletonRows={4}
    >
      <div className="space-y-3">
        {chats.slice(0, 5).map((chat) => (
          <div
            key={chat.agentId}
            className="flex items-center gap-3 p-3 bg-base-300 rounded-lg hover:bg-base-100 transition-colors"
          >
            {/* Agent avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {chat.agentName?.charAt(0).toUpperCase() ?? "A"}
            </div>

            {/* Chat info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{chat.agentName}</p>
                <span className="text-xs text-base-content/50 whitespace-nowrap">
                  {formatRelativeTime(chat.lastUpdated)}
                </span>
              </div>
              <p className="text-sm text-base-content/70 truncate">
                {truncateMessage(chat.lastMessage)}
              </p>
              <span className="text-xs text-base-content/50">
                {chat.messageCount} messages
              </span>
            </div>

            {/* Quick action */}
            <Link
              href={`/x402-chat?agent=${chat.agentId}`}
              className="btn btn-sm btn-primary btn-outline"
            >
              Continue
            </Link>
          </div>
        ))}
      </div>

      {/* View all link */}
      {chats.length > 5 && (
        <div className="mt-4 text-center">
          <Link href="/x402-chat" className="link text-base-content text-sm">
            View all {chats.length} chats →
          </Link>
        </div>
      )}
    </DashboardSection>
  );
}
