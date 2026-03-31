"use client";

import { cn } from "@/lib/cn";

export type ExploreTab = "bonfires" | "datarooms" | "hyperblogs";

const TABS: { key: ExploreTab; label: string; description: string; icon: string; stat?: string }[] = [
  {
    key: "bonfires",
    label: "Bonfires",
    description: "Community-driven knowledge spaces with AI agents and knowledge graphs",
    icon: "🔥",
  },
  {
    key: "datarooms",
    label: "Data Rooms",
    description: "Curated access points into bonfire knowledge graphs with dynamic pricing",
    icon: "📊",
  },
  {
    key: "hyperblogs",
    label: "Hyperblogs",
    description: "AI-generated articles and evaluations produced from data rooms",
    icon: "📝",
  },
];

interface ExploreTabsProps {
  activeTab: ExploreTab;
  onTabChange: (tab: ExploreTab) => void;
}

export default function ExploreTabs({ activeTab, onTabChange }: ExploreTabsProps) {
  const active = TABS.find((t) => t.key === activeTab);

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

      {/* Active tab context banner */}
      {active && (
        <div className="mt-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#FFFFFF04] to-[#FFFFFF08] border border-[#ffffff0a]">
          <span className="text-lg leading-none mt-0.5 shrink-0">{active.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-dark-s-0 uppercase tracking-wider">{active.label}</span>
            <p className="text-xs text-dark-s-80 mt-0.5 leading-relaxed">{active.description}</p>
          </div>
          <div className="shrink-0 text-[10px] text-dark-s-80 font-mono uppercase tracking-widest hidden sm:block mt-1">
            {active.key === "bonfires" && "Bonfire → Data Room → HyperBlog"}
            {active.key === "datarooms" && "Data Room → HyperBlog"}
            {active.key === "hyperblogs" && "HyperBlog"}
          </div>
        </div>
      )}
    </div>
  );
}
