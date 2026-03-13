"use client";

import { useCallback, useState } from "react";

import type { AgentFullResponse } from "@/types/agent-config";
import { useUpdateAgent } from "@/hooks/useAgentDeploy";
import { IdentitySection } from "../sections/IdentitySection";

interface GeneralTabProps {
  agent: AgentFullResponse;
  onSaved: () => void;
}

export function GeneralTab({ agent, onSaved }: GeneralTabProps) {
  const [name, setName] = useState(agent.name);
  const [context, setContext] = useState(agent.context);
  const [timezone, setTimezone] = useState(agent.timezone ?? "");
  const updateAgent = useUpdateAgent();

  const isDirty =
    name !== agent.name || context !== agent.context || timezone !== (agent.timezone ?? "");

  const handleSave = useCallback(async () => {
    await updateAgent.mutateAsync({
      agentId: agent.id,
      data: { name, context, timezone: timezone || undefined },
    });
    onSaved();
  }, [agent.id, name, context, timezone, updateAgent, onSaved]);

  return (
    <div className="space-y-4 max-w-2xl">
      <IdentitySection
        name={name}
        username={agent.username}
        context={context}
        timezone={timezone}
        disableUsername
        onChangeName={setName}
        onChangeContext={setContext}
        onChangeTimezone={setTimezone}
        largeContext
      />

      {isDirty && (
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={updateAgent.isPending}
          >
            {updateAgent.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setName(agent.name);
              setContext(agent.context);
              setTimezone(agent.timezone ?? "");
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
