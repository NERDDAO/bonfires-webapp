"use client";

/**
 * AgentConfigDashboard
 *
 * Main layout with agent list (left) and detail tabs (right).
 * Resolves the bonfire ID from the user's org, then loads agents.
 */
import { useCallback, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useBonfireAgents } from "@/hooks/useAgentDeploy";
import { AgentDeployWizard } from "@/components/dashboard/AgentDeployWizard";

import { AgentList } from "./AgentList";
import { AgentDetailTabs } from "./AgentDetailTabs";

interface OrgBonfireMapping {
  bonfire_id: string | null;
  is_admin: boolean;
  slug: string | null;
}

interface AgentConfigDashboardProps {
  orgId?: string;
}

export function AgentConfigDashboard({ orgId }: AgentConfigDashboardProps) {
  const searchParams = useSearchParams();
  const agentParam = searchParams.get("agent");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agentParam);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Resolve org → bonfire mapping
  const { data: mapping, isLoading: isMappingLoading } = useQuery({
    queryKey: ["org-bonfire-mapping", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${orgId}/bonfire-mapping`);
      if (!res.ok) throw new Error("Failed to resolve bonfire");
      return res.json() as Promise<OrgBonfireMapping>;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const bonfireId = mapping?.bonfire_id ?? undefined;

  // Load agents for bonfire
  const {
    data: agentsData,
    isLoading: isAgentsLoading,
    refetch: refetchAgents,
  } = useBonfireAgents(bonfireId);

  const agents = agentsData?.agents ?? [];

  // Auto-select first agent if none selected and no query param
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0]!.id);
    }
  }, [selectedAgentId, agents]);

  // Sync from URL query param when it changes
  useEffect(() => {
    if (agentParam) {
      setSelectedAgentId(agentParam);
    }
  }, [agentParam]);

  const handleCreateAgent = useCallback(() => {
    setIsWizardOpen(true);
  }, []);

  const handleWizardClose = useCallback(() => {
    setIsWizardOpen(false);
    refetchAgents();
  }, [refetchAgents]);

  const handleAgentDeleted = useCallback(() => {
    setSelectedAgentId(null);
    refetchAgents();
  }, [refetchAgents]);

  if (isMappingLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!bonfireId) {
    return (
      <div className="alert alert-warning">
        <span>No bonfire linked to your organization. Contact an admin to set up the mapping.</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-6 min-h-[600px]">
        {/* Left panel: Agent list */}
        <div className="w-72 shrink-0">
          <AgentList
            agents={agents}
            isLoading={isAgentsLoading}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            onCreateAgent={handleCreateAgent}
          />
        </div>

        {/* Right panel: Agent details */}
        <div className="flex-1 min-w-0">
          {selectedAgentId ? (
            <AgentDetailTabs
              agentId={selectedAgentId}
              bonfireId={bonfireId}
              onDeleted={handleAgentDeleted}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-base-content/40">
              <p>Select an agent to view its configuration</p>
            </div>
          )}
        </div>
      </div>

      {/* Deploy wizard modal */}
      {bonfireId && (
        <AgentDeployWizard
          bonfireId={bonfireId}
          bonfireName={mapping?.slug ?? bonfireId}
          isOpen={isWizardOpen}
          onClose={handleWizardClose}
        />
      )}
    </>
  );
}
