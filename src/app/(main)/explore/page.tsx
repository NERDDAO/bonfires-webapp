"use client";

import { Suspense, useCallback, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks";
import { useCreateDataRoom } from "@/hooks/mutations/useCreateDataRoom";
import { useBonfiresMint } from "@/hooks/web3/useBonfiresMint";
import { useWalletAccount } from "@/lib/wallet/e2e";
import { Search, ExternalLink } from "lucide-react";

import BonfiresTab, { type SortKey } from "@/components/explore/bonfires-tab";
import DataRoomsTab, { type DataRoomSortKey } from "@/components/explore/datarooms-tab";
import ExploreTabs, {
  type ExploreTab,
} from "@/components/explore/explore-tabs";
import HyperBlogsTab, { type HyperBlogSortKey } from "@/components/explore/hyperblogs-tab";
import { useDataRoomsQuery } from "@/hooks";
import type { DataRoomInfo } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cleanBonfireName } from "@/lib/utils/bonfire-name";

import { CreateBlogModal } from "@/components/hyperblogs/create-blog";
import { Modal } from "@/components/ui/modal";
import { DataRoomWizard } from "@/components/web3/DataRoomWizard";

// ─── Compact DataRoom card for sidebar ───────────────────────────────────────

function DataRoomMiniCard({
  data,
  onSelect,
}: {
  data: DataRoomInfo;
  onSelect: (dr: DataRoomInfo) => void;
}) {
  const bonfireName = cleanBonfireName(data.bonfire_name || "");
  const price = `$${data.current_hyperblog_price_usd ?? data.price_usd}`;

  return (
    <button
      onClick={() => onSelect(data)}
      className="w-full text-left p-3 rounded-xl bg-[#FFFFFF05] border border-[#333333] hover:border-brand-primary/40 transition-colors group"
    >
      <div className="text-sm font-medium text-dark-s-0 line-clamp-1 group-hover:text-brand-primary transition-colors">
        {data.description}
      </div>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {bonfireName && (
          <span className="text-[10px] text-dark-s-80">{bonfireName}</span>
        )}
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
          {price}
        </Badge>
        {data.htn_template_type && data.htn_template_type !== "blog" && (
          <Badge variant="filled" className="text-[10px] py-0 px-1.5 h-4 capitalize bg-[#f5572a]/15 text-[#f5572a] border-[#f5572a]/30">
            {data.htn_template_type}
          </Badge>
        )}
      </div>
    </button>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function ConfettiCard() {
  return (
    <a
      href="https://confetti.win/contest/mainnet/0x5fc82ac435ab66d0cbd9db0eff11b7ee8ba89121"
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden border border-[#6C3CE1]/40 bg-gradient-to-br from-[#6C3CE1]/15 via-[#1a1a2e] to-[#0a0a1a] hover:border-[#6C3CE1]/60 transition-all no-underline group"
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">🎊</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6C3CE1]">
            Confetti
          </span>
          <ExternalLink className="h-3 w-3 text-[#6C3CE1]/60 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="text-sm font-semibold text-dark-s-0">
          Vote on People&apos;s Prize
        </h3>
        <p className="text-[11px] text-dark-s-60 mt-1 leading-relaxed">
          Cast your vote for the best projects in the Synthesis contest on Confetti.
        </p>
      </div>
    </a>
  );
}

function MintCard() {
  const { totalMinted, maxSupply, priceEth, isLoading } = useBonfiresMint();

  return (
    <a
      href="https://mint.bonfires.ai"
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-[#1a1210] to-[#0a0a0a] hover:border-brand-primary/50 transition-all no-underline group"
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">🔥</span>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Bonfires NFT
          </span>
          <ExternalLink className="h-3 w-3 text-brand-primary/60 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="text-sm font-semibold text-dark-s-0">
          Mint on Ethereum
        </h3>
        {isLoading ? (
          <div className="flex gap-3 mt-2">
            <span className="h-4 w-16 bg-[#FFFFFF10] rounded animate-pulse" />
            <span className="h-4 w-12 bg-[#FFFFFF10] rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            <span className="text-dark-s-60">
              <span className="text-dark-s-0 font-medium">{totalMinted.toLocaleString()}</span>
              {maxSupply > 0 && <span> / {maxSupply.toLocaleString()}</span>} minted
            </span>
            <span className="text-dark-s-0 font-medium">
              {priceEth} ETH
            </span>
          </div>
        )}
      </div>
    </a>
  );
}

function SocialLinks() {
  return (
    <div className="flex gap-2">
      <a
        href="https://x.com/bonfiresai"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFFFFF05] border border-[#333333] text-dark-s-60 hover:border-dark-s-0/30 hover:text-dark-s-0 transition-colors no-underline text-xs font-medium"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        <span>Twitter</span>
      </a>
      <a
        href="https://t.me/bonfiresai"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFFFFF05] border border-[#333333] text-dark-s-60 hover:border-[#26A5E4]/40 hover:text-[#26A5E4] transition-colors no-underline text-xs font-medium"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
        <span>Telegram</span>
      </a>
    </div>
  );
}

function ExploreSidebar({ onCreateDataRoom, onCreateHyperBlog }: { onCreateDataRoom: () => void; onCreateHyperBlog: () => void }) {
  const { isSignedIn } = useAuth();

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0">
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* Featured cards */}
        <div>
          <h2 className="font-montserrat text-sm font-bold text-dark-s-0 uppercase tracking-wider mb-3">
            Featured
          </h2>
          <div className="space-y-3">
            <ConfettiCard />
            <MintCard />
          </div>
        </div>

        {/* Social row */}
        <SocialLinks />

        {/* Create — HyperBlog always visible, others require sign-in */}
        <div className="space-y-2">
          <h2 className="font-montserrat text-sm font-bold text-dark-s-0 uppercase tracking-wider">
            Create
          </h2>
          <button
            onClick={onCreateHyperBlog}
            className="w-full text-left px-3 py-2.5 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-sm text-brand-primary hover:bg-brand-primary/20 transition-colors"
          >
            + HyperBlog
          </button>
          {isSignedIn && (
            <button
              onClick={onCreateDataRoom}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-[#FFFFFF05] border border-[#333333] text-sm text-dark-s-60 hover:border-brand-primary/40 hover:text-dark-s-0 transition-colors"
            >
              + Data Room
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── DataRoom picker modal ───────────────────────────────────────────────────

function DataRoomPickerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dr: DataRoomInfo) => void;
}) {
  const { data: datarooms, isLoading } = useDataRoomsQuery();
  const activeDataRooms = (datarooms?.datarooms ?? []).filter((d) => d.is_active);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pick a Data Room" size="md">
      <p className="text-sm text-dark-s-60 mt-1 mb-4">
        Select a data room to create a HyperBlog from.
      </p>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-16 bg-[#FFFFFF08] rounded-xl animate-pulse" />
            ))
          : activeDataRooms.length === 0
            ? <p className="text-sm text-dark-s-80 text-center py-8">No data rooms available.</p>
            : activeDataRooms.map((dr) => (
                <DataRoomMiniCard key={dr.id} data={dr} onSelect={(d) => { onSelect(d); onClose(); }} />
              ))}
      </div>
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function ExplorePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL-synced state
  const tab = (searchParams.get("tab") as ExploreTab) || "bonfires";
  const urlSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(urlSearch);
  const [bonfireSortKey, setBonfireSortKey] = useState<SortKey>("newest");
  const [hyperblogSortKey, setHyperblogSortKey] = useState<HyperBlogSortKey>("created_at");
  const [dataroomSortKey, setDataroomSortKey] = useState<DataRoomSortKey>("total_purchases");

  // HyperBlog creation: picker → create modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDataRoom, setSelectedDataRoom] = useState<DataRoomInfo | null>(null);

  // DataRoom wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const createDataRoom = useCreateDataRoom();
  const { address } = useWalletAccount();

  const handleWizardComplete = useCallback(
    (config: {
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
      createDataRoom.mutate(
        {
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
        },
        {
          onSuccess: (data) => {
            setWizardOpen(false);
            const dataroomId = data.dataroom?.id;
            if (dataroomId) {
              router.push(`/hyperblogs/dataroom/${dataroomId}`);
            }
          },
        },
      );
    },
    [createDataRoom, router, address],
  );

  const updateUrl = useCallback(
    (newTab: ExploreTab, newSearch: string) => {
      const params = new URLSearchParams();
      if (newTab !== "bonfires") params.set("tab", newTab);
      if (newSearch.trim()) params.set("q", newSearch.trim());
      const qs = params.toString();
      router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  const handleTabChange = useCallback(
    (newTab: ExploreTab) => {
      setSearch("");
      updateUrl(newTab, "");
    },
    [updateUrl],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-montserrat text-2xl lg:text-4xl font-bold text-dark-s-0">
          Explore
        </h1>
        <p className="mt-2 text-dark-s-60 text-sm lg:text-base max-w-2xl">
          Discover hyperblogs, data rooms, and bonfires across the ecosystem.
        </p>
      </div>

      {/* Content: main + sidebar */}
      <div className="flex flex-col-reverse lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <ExploreTabs activeTab={tab} onTabChange={handleTabChange} />

          {/* Search — below tab banner, above filters */}
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-s-80 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                tab === "hyperblogs"
                  ? "Search hyperblogs..."
                  : tab === "datarooms"
                    ? "Search data rooms..."
                    : "Search bonfires..."
              }
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FFFFFF08] border border-[#333333] text-sm text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 transition-colors"
            />
          </div>

          {/* Tab content */}
          {tab === "hyperblogs" && (
            <HyperBlogsTab search={search} sortBy={hyperblogSortKey} onSortChange={setHyperblogSortKey} />
          )}
          {tab === "datarooms" && (
            <DataRoomsTab search={search} sortBy={dataroomSortKey} onSortChange={setDataroomSortKey} />
          )}
          {tab === "bonfires" && (
            <BonfiresTab
              search={search}
              sortKey={bonfireSortKey}
              onSortChange={setBonfireSortKey}
            />
          )}
        </div>

        {/* Sidebar */}
        <ExploreSidebar
          onCreateDataRoom={() => setWizardOpen(true)}
          onCreateHyperBlog={() => setPickerOpen(true)}
        />
      </div>

      {/* DataRoom wizard modal */}
      <DataRoomWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={handleWizardComplete}
        publicOnly
      />

      {/* DataRoom picker → Create Blog flow */}
      <DataRoomPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(dr) => setSelectedDataRoom(dr)}
      />
      {selectedDataRoom && (
        <CreateBlogModal
          isOpen={!!selectedDataRoom}
          onClose={() => setSelectedDataRoom(null)}
          dataroomId={selectedDataRoom.id}
          dataroomTitle={selectedDataRoom.description}
          dataroomPriceUsd={selectedDataRoom.price_usd}
          htnTemplateId={selectedDataRoom.htn_template_id}
          htnTemplateType={selectedDataRoom.htn_template_type}
        />
      )}
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorePageInner />
    </Suspense>
  );
}
