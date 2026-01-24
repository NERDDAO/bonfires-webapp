/**
 * Documents Page
 *
 * Document management page with upload, list, and taxonomy features.
 * Accessible from /documents
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useBonfireSelection } from "@/components/shared/BonfireSelector";
import { BonfireSelector } from "@/components/shared/BonfireSelector";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import {
  DocumentUpload,
  DocumentsTable,
  DocumentSummaryCards,
  TaxonomyLabelsPanel,
} from "@/components/documents";
import { useLabeledChunks } from "@/hooks";
import { toast } from "@/components/common";
import type { DocumentChunk, TaxonomyLabel, DocumentSummary } from "@/types";

export default function DocumentsPage() {
  const {
    selectedBonfireId,
    onBonfireChange,
    isLoading: isBonfiresLoading,
  } = useBonfireSelection("documents");

  // Label filtering
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isLabeling, setIsLabeling] = useState(false);

  // Fetch all labeled chunks (for taxonomy computation)
  const {
    data: chunksData,
    isLoading: isChunksLoading,
    refetch: refetchChunks,
  } = useLabeledChunks({
    bonfireId: selectedBonfireId,
    enabled: !!selectedBonfireId,
  });

  // Get all chunks from response
  const allChunks: DocumentChunk[] = useMemo(() => {
    return chunksData?.chunks ?? [];
  }, [chunksData]);

  // Filter chunks by selected label on client side
  const filteredChunks = useMemo(() => {
    if (!selectedLabel) return allChunks;
    return allChunks.filter((chunk) =>
      chunk.labels?.includes(selectedLabel)
    );
  }, [allChunks, selectedLabel]);

  // Extract taxonomy labels from all chunks
  const taxonomyLabels: TaxonomyLabel[] = useMemo(() => {
    const labelCounts = new Map<string, number>();
    allChunks.forEach((chunk) => {
      chunk.labels?.forEach((label) => {
        labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
      });
    });
    return Array.from(labelCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [allChunks]);

  // Calculate summary statistics
  const summary: DocumentSummary = useMemo(() => {
    const totalChunks = chunksData?.total ?? allChunks.length;
    const labeledChunks = allChunks.filter(
      (c) => c.labels && c.labels.length > 0
    ).length;
    return {
      total_documents: totalChunks, // Using chunk count as doc proxy for now
      total_chunks: totalChunks,
      labeled_chunks: labeledChunks,
      unlabeled_chunks: totalChunks - labeledChunks,
    };
  }, [allChunks, chunksData]);

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

        {/* Bonfire selector */}
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

        {selectedBonfireId ? (
          <div className="space-y-8">
            {/* Summary cards */}
            <DocumentSummaryCards
              summary={summary}
              isLoading={isLoading}
            />

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left column: Upload and taxonomy */}
              <div className="lg:col-span-1 space-y-6">
                {/* Document upload */}
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h2 className="card-title text-lg mb-3">
                      Upload Document
                    </h2>
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
                        {filteredChunks.length} chunk
                        {filteredChunks.length !== 1 ? "s" : ""}
                        {selectedLabel &&
                          ` (${allChunks.length} total)`}
                      </div>
                    </div>
                    <DocumentsTable
                      chunks={filteredChunks}
                      isLoading={isLoading}
                    />
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
