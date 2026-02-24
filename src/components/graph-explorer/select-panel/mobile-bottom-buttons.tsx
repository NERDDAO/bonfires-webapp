"use client";

import { cn } from "@/lib/cn";

import { useGraphExplorerPanel } from "./panel-context";
import { border } from "./select-panel-constants";

export function MobileBottomButtons() {
  const panel = useGraphExplorerPanel();
  const toggleRecentActivity = () =>
    panel.setIsRecentActivityCollapsed((prev) => !prev);

  return (
    <div className="absolute bottom-0 h-10 z-50 flex lg:hidden mb-2 w-full px-4 gap-2">
      <button
        type="button"
        onClick={toggleRecentActivity}
        className={cn(
          "flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium",
          border,
          "bg-[#1C1D21]"
        )}
      >
        {panel.isRecentActivityCollapsed ? "Recent activity" : "Hide activity"}
      </button>

      {panel.onOpenChat && (
        <button
          type="button"
          onClick={panel.onOpenChat}
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
