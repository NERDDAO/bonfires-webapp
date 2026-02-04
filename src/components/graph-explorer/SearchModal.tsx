"use client";

/**
 * SearchModal
 *
 * Modal with search input for graph search. Same behavior as inline search bar.
 */

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
  className?: string;
}

export function SearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching = false,
  className,
}: SearchModalProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") onSearch();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search graph"
      size="md"
      className={className}
    >
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search graph..."
            className={cn(
              "flex-1 px-3 py-2.5 rounded-xl text-sm lg:text-base",
              "bg-[#181818] border border-[#333333] text-white",
              "placeholder:text-[#A9A9A9]",
              "focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-[#646464]"
            )}
            aria-label="Search query"
            autoFocus
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={!searchQuery.trim() || isSearching}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium",
              "bg-primary text-primary-content",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
            aria-label="Search"
          >
            Search
          </button>
        </div>
      </div>
    </Modal>
  );
}
