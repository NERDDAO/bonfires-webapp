/**
 * useCreateHTNTemplate Hook
 *
 * React Query mutation hook for creating new HTN templates.
 * Invalidates HTN template queries on success.
 */
"use client";

import type { CreateHTNTemplateRequest, HTNTemplateInfo } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/**
 * Hook for creating new HTN templates
 */
export function useCreateHTNTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: CreateHTNTemplateRequest
    ): Promise<HTNTemplateInfo> => {
      return apiClient.post<HTNTemplateInfo>("/api/htn-templates", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["htn-templates"],
      });
    },
  });
}
