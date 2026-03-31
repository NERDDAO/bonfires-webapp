"use client";

import { useCallback, useState } from "react";

import type { AgentFullResponse, LlmConfig } from "@/types/agent-config";
import { DEFAULT_LLM_CONFIG } from "@/types/agent-config";
import { useUpdateLlmConfig } from "@/hooks/useAgentConfig";
import { LlmConfigSection } from "../sections/LlmConfigSection";

interface LlmConfigTabProps {
  agent: AgentFullResponse;
  onSaved: () => void;
}

export function LlmConfigTab({ agent, onSaved }: LlmConfigTabProps) {
  const initial: LlmConfig = { ...DEFAULT_LLM_CONFIG, ...agent.llmConfig };
  const [config, setConfig] = useState<LlmConfig>(initial);
  const updateLlmConfig = useUpdateLlmConfig();

  const isDirty = JSON.stringify(config) !== JSON.stringify(initial);

  const handleSave = useCallback(async () => {
    await updateLlmConfig.mutateAsync({ agentId: agent.id, llmConfig: config });
    onSaved();
  }, [agent.id, config, updateLlmConfig, onSaved]);

  return (
    <div className="space-y-6 max-w-2xl">
      <LlmConfigSection config={config} onChange={setConfig} />

      {isDirty && (
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={updateLlmConfig.isPending}
          >
            {updateLlmConfig.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfig(initial)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
