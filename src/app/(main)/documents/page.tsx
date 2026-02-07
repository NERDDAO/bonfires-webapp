/**
 * Documents Page
 *
 * Document management page with upload, list, and taxonomy features.
 * Accessible from /documents
 */
"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { useSubdomainBonfire } from "@/contexts";
import {
  useBonfireById,
  useLabeledChunks,
  useTaxonomyStatsQuery,
} from "@/hooks";
import type { DocumentSummary, TaxonomyLabel } from "@/types";

import { toast } from "@/components/common";
import {
  DocumentSummaryCards,
  DocumentUpload,
  DocumentsTable,
  TaxonomyLabelsPanel,
} from "@/components/documents";
import { useBonfireSelection } from "@/components/shared/BonfireSelector";
import { BonfireSelector } from "@/components/shared/BonfireSelector";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";

/**
 * Documents Page
 *
 * Document management page with upload, list, and taxonomy features.
 * Accessible from /documents
 */

export default function DocumentsPage() {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const {
    selectedBonfireId: selectionBonfireId,
    onBonfireChange,
    isLoading: isBonfiresLoading,
  } = useBonfireSelection("documents");

  const selectedBonfireId =
    isSubdomainScoped && subdomainConfig
      ? subdomainConfig.bonfireId
      : selectionBonfireId;

  // Label filtering
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isLabeling, setIsLabeling] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const previewLimit = 3;

  // Fetch all labeled chunks (for taxonomy computation)
  const {
    data: chunksData,
    isLoading: isChunksLoading,
    refetch: refetchChunks,
  } = useLabeledChunks({
    bonfireId: selectedBonfireId,
    label: selectedLabel ?? undefined,
    groupBy: "document",
    previewLimit,
    page,
    pageSize,
    enabled: !!selectedBonfireId,
  });

  useEffect(() => {
    setPage(1);
  }, [selectedBonfireId, selectedLabel]);

  const visibleDocuments = useMemo(() => {
    return chunksData?.documents ?? [];
  }, [chunksData]);

  const totalChunks = chunksData?.total_chunks ?? 0;
  const totalDocuments =
    chunksData?.summary?.total_documents ?? visibleDocuments.length;
  const totalPages =
    chunksData?.total_pages ??
    Math.max(1, Math.ceil(totalDocuments / pageSize));
  const canGoPrev = page > 1;
  const canGoNext = chunksData?.has_next ?? page < totalPages;

  // Extract taxonomy labels from response or visible chunks
  const { data: bonfireDetails } = useBonfireById(selectedBonfireId);
  const { data: taxonomyStats } = useTaxonomyStatsQuery(selectedBonfireId);

  const taxonomyLabels: TaxonomyLabel[] = useMemo(() => {
    const latestTaxonomies = bonfireDetails?.latest_taxonomies ?? [];
    if (latestTaxonomies.length === 0) {
      return chunksData?.labels ?? [];
    }

    const countById = new Map<string, number>();
    if (taxonomyStats?.taxonomy_stats) {
      for (const stat of taxonomyStats.taxonomy_stats) {
        if (stat.taxonomy_id) {
          countById.set(stat.taxonomy_id, stat.chunk_count);
        }
        countById.set(stat.taxonomy_name, stat.chunk_count);
      }
    }

    return latestTaxonomies.map((taxonomy) => {
      const taxonomyId = taxonomy.id ?? taxonomy._id ?? taxonomy.name;
      return {
        name: taxonomy.name,
        count: countById.get(taxonomyId) ?? countById.get(taxonomy.name) ?? 0,
      };
    });
  }, [bonfireDetails, chunksData, taxonomyStats]);

  // Calculate summary statistics
  const summary: DocumentSummary = useMemo(() => {
    if (chunksData?.summary) {
      return chunksData.summary;
    }
    return {
      total_documents: totalDocuments,
      total_chunks: totalChunks,
      labeled_chunks: chunksData?.labeled_chunks ?? 0,
      unlabeled_chunks: chunksData?.unlabeled_chunks ?? 0,
    };
  }, [chunksData, totalChunks, totalDocuments]);

  // Handle successful upload
  const handleUploadSuccess = useCallback(
    (documentId: string) => {
      toast.success(
        `Document uploaded successfully (ID: ${documentId.slice(0, 8)}...)`
      );
      refetchChunks();
    },
    [refetchChunks]
  );

  // Handle upload error
  const handleUploadError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  // Handle trigger labeling (placeholder for actual implementation)
  const handleTriggerLabeling = useCallback(async () => {
    if (!selectedBonfireId) return;

    setIsLabeling(true);
    try {
      // TODO: Implement actual labeling API call
      // await apiClient.post(`/api/bonfires/${selectedBonfireId}/label_chunks`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      toast.success("Labeling completed successfully");
      refetchChunks();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to trigger labeling"
      );
    } finally {
      setIsLabeling(false);
    }
  }, [selectedBonfireId, refetchChunks]);

  const isLoading = isBonfiresLoading || isChunksLoading;

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">
            Documents
          </h1>
          <p className="text-base-content/60">
            Upload and manage documents for knowledge graph ingestion
          </p>
        </div>

        {/* Bonfire selector - hidden when scoped to subdomain */}
        {!isSubdomainScoped && (
          <div className="mb-8">
            <label className="label">
              <span className="label-text font-semibold">Select Bonfire</span>
            </label>
            <div className="max-w-md">
              <BonfireSelector
                selectedBonfireId={selectedBonfireId}
                onBonfireChange={onBonfireChange}
                storageKey="documents"
                placeholder="Select a bonfire to manage documents"
              />
            </div>
          </div>
        )}

        {selectedBonfireId ? (
          <div className="space-y-8">
            {/* Summary cards */}
            <DocumentSummaryCards summary={summary} isLoading={isLoading} />

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left column: Upload and taxonomy */}
              <div className="lg:col-span-1 space-y-6">
                {/* Document upload */}
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h2 className="card-title text-lg mb-3">Upload Document</h2>
                    <DocumentUpload
                      bonfireId={selectedBonfireId}
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                  </div>
                </div>

                {/* Taxonomy labels panel */}
                <TaxonomyLabelsPanel
                  labels={taxonomyLabels}
                  selectedLabel={selectedLabel}
                  onLabelSelect={setSelectedLabel}
                  onTriggerLabeling={handleTriggerLabeling}
                  isLabeling={isLabeling}
                  isLoading={isLoading}
                />
              </div>

              {/* Right column: Documents table */}
              <div className="lg:col-span-3">
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="card-title text-lg">
                        Documents
                        {selectedLabel && (
                          <span className="badge badge-primary badge-sm ml-2">
                            Filtered: {selectedLabel}
                          </span>
                        )}
                      </h2>
                      <div className="text-sm text-base-content/60">
                        {visibleDocuments.length} document
                        {visibleDocuments.length !== 1 ? "s" : ""}
                        {totalDocuments > visibleDocuments.length &&
                          ` (${totalDocuments} total)`}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mb-4 text-sm text-base-content/60">
                      <span>
                        Page {page} of {totalPages}
                      </span>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={!canGoPrev}
                      >
                        Prev
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={!canGoNext}
                      >
                        Next
                      </button>
                    </div>
                    <DocumentsListTable documents={visibleDocuments} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state when no bonfire selected */
          <div className="text-center py-16">
            <svg
              className="w-20 h-20 mx-auto text-base-content/20 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-base-content/60 mb-3">
              Select a bonfire to get started
            </h2>
            <p className="text-base-content/40 max-w-md mx-auto">
              Choose a bonfire from the dropdown above to view and manage
              documents. Each bonfire has its own document collection.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

interface DocumentPreviewChunk {
  id?: string;
  content?: string;
  index?: number;
  category?: string;
}

interface DocumentPreview {
  doc_id?: string;
  chunk_count?: number;
  taxonomies?: string[];
  preview_chunks?: DocumentPreviewChunk[];
}

function DocumentsListTable({ documents }: { documents: DocumentPreview[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/50">
        No documents available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Doc ID</th>
            <th>Chunks</th>
            <th>Taxonomies</th>
            <th>Preview</th>
            <th className="w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, idx) => {
            const rowKey = doc.doc_id ?? `doc-${idx}`;
            const isExpanded = expandedRows.has(rowKey);
            const previewChunks = doc.preview_chunks ?? [];
            const hasPreview = previewChunks.length > 0;

            return (
              <Fragment key={rowKey}>
                <tr className="hover">
                  <td className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span>
                        {doc.doc_id ? `${doc.doc_id.slice(0, 8)}...` : "—"}
                      </span>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => copyToClipboard(doc.doc_id ?? "")}
                        disabled={!doc.doc_id}
                        title="Copy full Doc ID"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>{doc.chunk_count ?? 0}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {doc.taxonomies && doc.taxonomies.length > 0 ? (
                        doc.taxonomies.map((taxonomy, taxIdx) => (
                          <span
                            key={`${taxonomy}-${taxIdx}`}
                            className="badge badge-outline badge-sm"
                          >
                            {taxonomy}
                          </span>
                        ))
                      ) : (
                        <span className="text-base-content/40">
                          No taxonomies
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-md">
                    {hasPreview && previewChunks[0]?.content ? (
                      <div className="text-sm line-clamp-2">
                        {previewChunks[0].content}
                      </div>
                    ) : (
                      <span className="text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    {hasPreview && (
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => toggleRow(rowKey)}
                      >
                        {isExpanded ? "Hide" : "Show"}
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && hasPreview && (
                  <tr className="bg-base-200/60">
                    <td colSpan={5}>
                      <div className="space-y-2 p-3">
                        {previewChunks.map((chunk, chunkIdx) => (
                          <div
                            key={chunk.id ?? `preview-${chunkIdx}`}
                            className="rounded-lg border border-base-300 bg-base-100 p-3"
                          >
                            <div className="text-xs text-base-content/60 mb-1">
                              Chunk #{chunk.index ?? "—"} •{" "}
                              {chunk.category ?? "Unlabeled"}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">
                              {chunk.content ?? ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
