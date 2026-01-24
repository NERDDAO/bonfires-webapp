"use client";

import { useState } from "react";

interface TechItem {
  name: string;
  description: string;
  category: "ai" | "web3" | "infra";
}

const techItems: TechItem[] = [
  {
    name: "Knowledge Graphs",
    description:
      "Graphiti-powered knowledge graph traversal and semantic relationship mapping",
    category: "ai",
  },
  {
    name: "AI Agents",
    description:
      "Intelligent agents that understand context and assist with exploration",
    category: "ai",
  },
  {
    name: "HTN Generation",
    description:
      "Hierarchical Task Network for structured blog and content creation",
    category: "ai",
  },
  {
    name: "Vector Search",
    description:
      "Semantic similarity search with taxonomy resolution for precise matching",
    category: "ai",
  },
  {
    name: "x402 Protocol",
    description:
      "Payment verification and settlement for Web3 monetization features",
    category: "web3",
  },
  {
    name: "RainbowKit + wagmi",
    description: "Seamless wallet connection and transaction signing",
    category: "web3",
  },
  {
    name: "On-Chain Verification",
    description: "Blockchain-verified payments and subscription tracking",
    category: "web3",
  },
  {
    name: "Next.js 14",
    description: "React framework with server components and API routes",
    category: "infra",
  },
  {
    name: "Async Processing",
    description:
      "Background task processing with status polling for long operations",
    category: "infra",
  },
  {
    name: "React Query",
    description:
      "Server state management with caching and request deduplication",
    category: "infra",
  },
];

const categoryLabels: Record<TechItem["category"], string> = {
  ai: "AI & ML",
  web3: "Web3",
  infra: "Infrastructure",
};

const categoryColors: Record<TechItem["category"], string> = {
  ai: "text-primary",
  web3: "text-secondary",
  infra: "text-accent",
};

export function TechStack() {
  const [isExpanded, setIsExpanded] = useState(false);

  const groupedTech = techItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<TechItem["category"], TechItem[]>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div
        className="collapse collapse-plus bg-base-100 border border-base-content/10 rounded-xl shadow-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <input
          type="checkbox"
          checked={isExpanded}
          onChange={() => setIsExpanded(!isExpanded)}
          aria-label="Toggle technology stack details"
        />
        <div className="collapse-title text-xl font-semibold px-6 py-5 cursor-pointer">
          Technology Stack
          <span className="text-sm font-normal text-base-content/50 ml-2">
            ({techItems.length} technologies)
          </span>
        </div>
        <div className="collapse-content px-6 pb-6">
          <div className="grid gap-8 pt-2">
            {(Object.keys(groupedTech) as TechItem["category"][]).map(
              (category) => (
                <div key={category}>
                  <p
                    className={`text-sm font-semibold uppercase tracking-wider mb-3 ${categoryColors[category]}`}
                  >
                    {categoryLabels[category]}
                  </p>
                  <div className="grid gap-3">
                    {groupedTech[category].map((tech) => (
                      <div
                        key={tech.name}
                        className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors"
                      >
                        <span
                          className={`font-medium min-w-[140px] ${categoryColors[category]}`}
                        >
                          {tech.name}
                        </span>
                        <span className="text-base-content/70 text-sm">
                          {tech.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechStack;
