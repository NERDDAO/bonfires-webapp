/**
 * useDocumentsQuery Hook
 *
 * React Query hook for fetching documents with filtering by bonfire.
 * Supports pagination, status filtering, and label filtering.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { DocumentInfo, DocumentChunk, LabeledChunksResponse } from "@/types";

type DocumentStatus = "pending" | "processing" | "completed" | "failed";

interface UseDocumentsQueryParams {
  /** Filter by bonfire ID (required) */
  bonfireId: string | null;
  /** Filter by processing status */
  status?: DocumentStatus | null;
  /** Filter by taxonomy label */
  label?: string | null;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

interface DocumentsListResponse {
  documents: DocumentInfo[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response from the labeled_chunks endpoint
 */
interface ChunksListResponse {
  chunks: DocumentChunk[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Generate query key for documents
 */
export function documentsQueryKey(params: UseDocumentsQueryParams) {
  return [
    "documents",
    {
      bonfireId: params.bonfireId,
      status: params.status ?? null,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  ] as const;
}

/**
 * Build query string from params
 */
function buildQueryString(params: UseDocumentsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.bonfireId) {
    searchParams.set("bonfire_id", params.bonfireId);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.offset) {
    searchParams.set("offset", String(params.offset));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetch documents for a bonfire
 */
export function useDocumentsQuery(params: UseDocumentsQueryParams) {
  const { enabled = true, ...filterParams } = params;

  return useQuery({
    queryKey: documentsQueryKey(filterParams),
    queryFn: () => {
      const queryString = buildQueryString(filterParams);
      return apiClient.get<DocumentsListResponse>(`/api/documents${queryString}`);
    },
    enabled: enabled && !!filterParams.bonfireId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch a single document by ID
 */
export function useDocumentById(docId: string | null) {
  return useQuery({
    queryKey: ["documents", docId],
    queryFn: () => apiClient.get<DocumentInfo>(`/api/documents/${docId}`),
    enabled: !!docId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch only completed documents for a bonfire
 */
export function useCompletedDocuments(bonfireId: string | null) {
  return useDocumentsQuery({
    bonfireId,
    status: "completed",
    enabled: !!bonfireId,
  });
}

/**
 * Fetch processing documents (for status tracking)
 */
export function useProcessingDocuments(bonfireId: string | null) {
  return useDocumentsQuery({
    bonfireId,
    status: "processing",
    enabled: !!bonfireId,
  });
}

/**
 * Query key for labeled chunks
 */
export function labeledChunksQueryKey(params: {
  bonfireId: string | null;
  label?: string | null;
  limit?: number;
  offset?: number;
}) {
  return [
    "labeledChunks",
    {
      bonfireId: params.bonfireId,
      label: params.label ?? null,
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
    },
  ] as const;
}

interface UseLabeledChunksParams {
  /** Filter by bonfire ID (required) */
  bonfireId: string | null;
  /** Filter by taxonomy label */
  label?: string | null;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Fetch labeled chunks for a bonfire
 * This calls the /api/documents endpoint which proxies to /bonfire/{id}/labeled_chunks
 */
export function useLabeledChunks(params: UseLabeledChunksParams) {
  const { enabled = true, bonfireId, label, limit = 50, offset = 0 } = params;

  return useQuery({
    queryKey: labeledChunksQueryKey({ bonfireId, label, limit, offset }),
    queryFn: async (): Promise<ChunksListResponse> => {
      const searchParams = new URLSearchParams();

      if (bonfireId) {
        searchParams.set("bonfire_id", bonfireId);
      }
      if (label) {
        searchParams.set("label", label);
      }
      searchParams.set("limit", String(limit));
      searchParams.set("offset", String(offset));

      const queryString = searchParams.toString();
      const response = await apiClient.get<ChunksListResponse>(
        `/api/documents?${queryString}`
      );

      // Transform response if needed (ensure chunks array exists)
      return {
        chunks: response.chunks ?? [],
        total: response.total ?? 0,
        limit: response.limit ?? limit,
        offset: response.offset ?? offset,
      };
    },
    enabled: enabled && !!bonfireId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
