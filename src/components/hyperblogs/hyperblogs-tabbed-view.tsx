"use client";

import { useEffect, useRef, useState } from "react";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { usePublicHyperBlogsInfiniteQuery } from "@/hooks/queries/useHyperBlogsQuery";
import { useCreateDataRoom } from "@/hooks/mutations/useCreateDataRoom";
import { useWalletAccount } from "@/lib/wallet/e2e";

import { HyperBlogInfo } from "@/types";

import HyperBlogsHeader from "./header";
import HyperBlogCard from "./hyperblog-card";
import DataroomFeed from "./dataroom-feed";
import { DataRoomWizard } from "../web3/DataRoomWizard";

type Tab = "hyperblogs" | "datarooms";

const PAGE_SIZE = 8;

export function HyperblogsTabbedView() {
  const [activeTab, setActiveTab] = useState<Tab>("hyperblogs");
  const [wizardOpen, setWizardOpen] = useState(false);
  const createDataRoom = useCreateDataRoom();
  const { address } = useWalletAccount();

  const handleWizardComplete = (config: {
    bonfireId: string;
    description: string;
    systemPrompt?: string;
    centerNodeUuid: string;
    priceUsd: number;
    queryLimit: number;
    expirationDays: number;
    dynamicPricingEnabled?: boolean;
    priceStepUsd?: number;
    priceDecayRate?: number;
    imageModel?: "schnell" | "dev" | "pro" | "realism";
    htnTemplateId?: string;
  }) => {
    createDataRoom.mutate({
      bonfire_id: config.bonfireId,
      description: config.description,
      system_prompt: config.systemPrompt ?? "",
      center_node_uuid: config.centerNodeUuid,
      price_usd: config.priceUsd,
      query_limit: config.queryLimit,
      expiration_days: config.expirationDays,
      dynamic_pricing_enabled: config.dynamicPricingEnabled,
      price_step_usd: config.priceStepUsd,
      price_decay_rate: config.priceDecayRate,
      image_model: config.imageModel,
      htn_template_id: config.htnTemplateId,
      creator_wallet: address ?? "",
    });
  };

  return (
    <>
      <HyperBlogsHeader onCreateClick={() => setWizardOpen(true)} />

      <div role="tablist" className="tabs tabs-bordered mt-6">
        <button
          role="tab"
          className={`tab ${activeTab === "hyperblogs" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("hyperblogs")}
        >
          Hyperblogs
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "datarooms" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("datarooms")}
        >
          Datarooms
        </button>
      </div>

      {activeTab === "hyperblogs" && <HyperblogsFlatFeed />}
      {activeTab === "datarooms" && (
        <DataroomFeed sortBy="total_purchases" />
      )}

      <DataRoomWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={handleWizardComplete}
        publicOnly
        defaultPriceUsd={1.0}
      />
    </>
  );
}

function HyperblogsFlatFeed() {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const bonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;

  const {
    data,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicHyperBlogsInfiniteQuery({
    bonfireId,
    sortBy: "upvotes",
    pageSize: PAGE_SIZE,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const hyperblogs =
    data?.pages.flatMap(
      (page: { hyperblogs: HyperBlogInfo[] }) => page.hyperblogs
    ) ?? [];
  const placeholderCount = isFetchingNextPage ? PAGE_SIZE : 0;
  const totalCount = hyperblogs.length + placeholderCount;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <div className="mt-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {Array.from({ length: totalCount || PAGE_SIZE }, (_, index) => {
          const blog = hyperblogs[index];
          return index < hyperblogs.length && blog ? (
            <HyperBlogCard
              key={blog.id}
              data={blog}
              href={`/hyperblogs/${blog.id}`}
              variant="featured"
            />
          ) : (
            <HyperBlogCard key={`skeleton-${index}`} isLoading href="#" variant="featured" />
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-1 min-h-1" aria-hidden="true" />

      {isError && (
        <div className="mt-4 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load hyperblogs"}
        </div>
      )}
    </>
  );
}
