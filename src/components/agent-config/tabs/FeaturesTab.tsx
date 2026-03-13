"use client";

import { useCallback, useState } from "react";

import type { AgentFeatures, AgentFullResponse } from "@/types/agent-config";
import { DEFAULT_AGENT_FEATURES } from "@/types/agent-config";
import { useUpdateAgentFeatures } from "@/hooks/useAgentConfig";
import { FeaturesSection } from "../sections/FeaturesSection";

interface FeaturesTabProps {
  agent: AgentFullResponse;
  onSaved: () => void;
}

export function FeaturesTab({ agent, onSaved }: FeaturesTabProps) {
  const initial: AgentFeatures = { ...DEFAULT_AGENT_FEATURES, ...agent.agentFeatures };
  const [features, setFeatures] = useState<AgentFeatures>(initial);
  const updateFeatures = useUpdateAgentFeatures();

  const isDirty = JSON.stringify(features) !== JSON.stringify(initial);

  const handleSave = useCallback(async () => {
    await updateFeatures.mutateAsync({ agentId: agent.id, agentFeatures: features });
    onSaved();
  }, [agent.id, features, updateFeatures, onSaved]);

  return (
    <div className="space-y-6 max-w-2xl">
      <FeaturesSection features={features} onChange={setFeatures} />

      {isDirty && (
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={updateFeatures.isPending}
          >
            {updateFeatures.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setFeatures(initial)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
