"use client";

import { cn } from "@/lib/cn";

export type ExploreTab = "bonfires" | "datarooms" | "hyperblogs";

const TABS: { key: ExploreTab; label: string; description: string }[] = [
  { key: "bonfires", label: "Bonfires", description: "Community-driven knowledge spaces with AI agents and knowledge graphs" },
  { key: "datarooms", label: "Data Rooms", description: "Curated access points into bonfire knowledge graphs with dynamic pricing" },
  { key: "hyperblogs", label: "Hyperblogs", description: "AI-generated articles and evaluations produced from data rooms" },
];

interface ExploreTabsProps {
  activeTab: ExploreTab;
  onTabChange: (tab: ExploreTab) => void;
}

export default function ExploreTabs({ activeTab, onTabChange }: ExploreTabsProps) {
  const activeDescription = TABS.find((t) => t.key === activeTab)?.description;

  return (
    <div className="mb-5">
      <div className="grid grid-cols-3 border-b border-[#333333]">
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
      {activeDescription && (
        <p className="text-xs text-dark-s-80 mt-2">{activeDescription}</p>
      )}
    </div>
  );
}
