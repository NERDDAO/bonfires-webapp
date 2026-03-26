"use client";

import { cn } from "@/lib/cn";

export type ExploreTab = "hyperblogs" | "datarooms" | "bonfires";

const TABS: { key: ExploreTab; label: string }[] = [
  { key: "hyperblogs", label: "Hyperblogs" },
  { key: "datarooms", label: "Data Rooms" },
  { key: "bonfires", label: "Bonfires" },
];

interface ExploreTabsProps {
  activeTab: ExploreTab;
  onTabChange: (tab: ExploreTab) => void;
}

export default function ExploreTabs({ activeTab, onTabChange }: ExploreTabsProps) {
  return (
    <div className="grid grid-cols-3 border-b border-[#333333] mb-5">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "py-3 text-sm font-montserrat font-bold uppercase tracking-wide transition-colors text-center",
            activeTab === tab.key
              ? "border-b-2 border-[#f5572a] text-white"
              : "text-dark-s-500 hover:text-dark-s-200",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
