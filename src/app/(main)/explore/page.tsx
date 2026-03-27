"use client";

import { Suspense, useCallback, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth, useHackathonTracks } from "@/hooks";
import { Search } from "lucide-react";

import BonfiresTab, { type SortKey } from "@/components/explore/bonfires-tab";
import DataRoomsTab, { type DataRoomSortKey } from "@/components/explore/datarooms-tab";
import ExploreTabs, {
  type ExploreTab,
} from "@/components/explore/explore-tabs";
import HyperBlogsTab, { type HyperBlogSortKey } from "@/components/explore/hyperblogs-tab";
import TrackCard, {
  TrackCardSkeleton,
} from "@/components/hackathon/track-card";
import { useDataRoomsQuery } from "@/hooks";
import type { DataRoomInfo } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cleanBonfireName } from "@/lib/utils/bonfire-name";
import { truncateAddress } from "@/lib/utils";
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

function ExploreSidebar({ onCreateDataRoom, onCreateHyperBlog }: { onCreateDataRoom: () => void; onCreateHyperBlog: () => void }) {
  const { data: tracks, isLoading: tracksLoading } = useHackathonTracks();
  const { isSignedIn } = useAuth();

  const activeTracks = (tracks ?? []).filter(
    (t) => t.status === "active" || t.status === "upcoming",
  );

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0">
      <div className="lg:sticky lg:top-24 space-y-6">
        {/* Hackathon tracks */}
        {(tracksLoading || activeTracks.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-montserrat text-sm font-bold text-dark-s-0 uppercase tracking-wider">
                Hackathon Tracks
              </h2>
              <Link
                href="/hackathon"
                className="text-brand-primary text-xs hover:underline no-underline"
              >
                View all
              </Link>
            </div>
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {tracksLoading
                ? Array.from({ length: 2 }, (_, i) => (
                    <TrackCardSkeleton key={`skel-${i}`} className="min-w-[240px] lg:min-w-0" />
                  ))
                : activeTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      compact
                      className="min-w-[240px] lg:min-w-0"
                    />
                  ))}
            </div>
          </div>
        )}

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
            <>
              <button
                onClick={onCreateDataRoom}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-[#FFFFFF05] border border-[#333333] text-sm text-dark-s-60 hover:border-brand-primary/40 hover:text-dark-s-0 transition-colors"
              >
                + Data Room
              </button>
              <Link
                href="/hackathon"
                className="block w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF05] border border-[#333333] text-sm text-dark-s-60 hover:border-brand-primary/40 hover:text-dark-s-0 transition-colors no-underline"
              >
                + Hackathon Track
              </Link>
            </>
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
        onComplete={() => setWizardOpen(false)}
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
