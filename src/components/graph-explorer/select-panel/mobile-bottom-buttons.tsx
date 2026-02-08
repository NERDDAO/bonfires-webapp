"use client";

import { cn } from "@/lib/cn";

import { border } from "./select-panel-constants";

export interface MobileBottomButtonsProps {
  isRecentActivityCollapsed: boolean;
  onToggleRecentActivity: () => void;
  onOpenChat?: () => void;
}

export function MobileBottomButtons({
  isRecentActivityCollapsed,
  onToggleRecentActivity,
  onOpenChat,
}: MobileBottomButtonsProps) {
  return (
    <div className="absolute bottom-0 h-10 z-50 flex lg:hidden mb-2 w-full px-4 gap-2">
      <button
        type="button"
        onClick={onToggleRecentActivity}
        className={cn(
          "flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium",
          border,
          "bg-[#1C1D21]"
        )}
      >
        {isRecentActivityCollapsed ? "Recent activity" : "Hide activity"}
      </button>

      {onOpenChat && (
        <button
          type="button"
          onClick={onOpenChat}
          className={cn(
            "flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium",
            border,
            "bg-[#1C1D21]"
          )}
        >
          Chat
        </button>
      )}
    </div>
  );
}
