/**
 * useIngestDocument Hook
 *
 * React Query mutation hook for ingesting documents.
 * Supports both direct content and file uploads with progress tracking.
 */
"use client";

import type {
  DocumentInfo,
  DocumentIngestRequest,
  DocumentIngestResponse,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { documentsQueryKey } from "@/hooks/queries";

import { apiClient } from "@/lib/api/client";

/**
 * useIngestDocument Hook
 *
 * React Query mutation hook for ingesting documents.
 * Supports both direct content and file uploads with progress tracking.
 */

interface IngestDocumentParams {
  /** The bonfire to ingest into */
  bonfireId: string;
  /** Document content (for text-based ingestion) */
  content?: string;
  /** File to upload */
  file?: File;
  /** Optional filename override */
  filename?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

interface IngestResult {
  documentId: string;
  success: boolean;
  message?: string;
}

/**
 * Read file content as text
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Hook for ingesting documents into a bonfire
 */
export function useIngestDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: IngestDocumentParams): Promise<IngestResult> => {
      const { bonfireId, content, file, filename, metadata } = params;

      let documentContent = content ?? "";
      let documentFilename = filename;

      // If a file is provided, read its content
      if (file) {
        documentContent = await readFileAsText(file);
        documentFilename = filename ?? file.name;
      }

      if (!documentContent.trim()) {
        throw new Error("Document content cannot be empty");
      }

      const request: DocumentIngestRequest = {
        content: documentContent,
        bonfire_id: bonfireId,
        filename: documentFilename,
        metadata,
      };

      const response = await apiClient.post<DocumentIngestResponse>(
        "/api/documents/ingest",
        request
      );

      if (!response.success) {
        throw new Error(response.message ?? "Document ingestion failed");
      }

      return {
        documentId: response.document_id ?? "",
        success: true,
        message: response.message ?? "Document ingested successfully",
      };
    },
    onSuccess: (_data, variables) => {
      // Invalidate documents queries for this bonfire
      queryClient.invalidateQueries({
        queryKey: documentsQueryKey({ bonfireId: variables.bonfireId }),
      });

      // Also invalidate the general documents list
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });
}

/**
 * Hook for batch document ingestion
 */
export function useBatchIngestDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      bonfireId: string;
      files: File[];
      metadata?: Record<string, unknown>;
    }): Promise<IngestResult[]> => {
      const { bonfireId, files, metadata } = params;

      const results: IngestResult[] = [];

      for (const file of files) {
        try {
          const content = await readFileAsText(file);

          const request: DocumentIngestRequest = {
            content,
            bonfire_id: bonfireId,
            filename: file.name,
            metadata,
          };

          const response = await apiClient.post<DocumentIngestResponse>(
            "/api/documents/ingest",
            request
          );

          results.push({
            documentId: response.document_id ?? "",
            success: response.success,
            message: response.message,
          });
        } catch (error) {
          results.push({
            documentId: "",
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to ingest document",
          });
        }
      }

      return results;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentsQueryKey({ bonfireId: variables.bonfireId }),
      });

      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });
}

/**
 * Hook for deleting a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      docId: string;
      bonfireId: string;
    }): Promise<void> => {
      await apiClient.delete(`/api/documents/${params.docId}`);
    },
    onSuccess: (_data, variables) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: ["documents", variables.docId],
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: documentsQueryKey({ bonfireId: variables.bonfireId }),
      });

      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });
}
