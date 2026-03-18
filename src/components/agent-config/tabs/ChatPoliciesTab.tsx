"use client";

import { useCallback, useState } from "react";

import type { AgentFullResponse, ChatConfig } from "@/types/agent-config";
import { DEFAULT_CHAT_CONFIG } from "@/types/agent-config";
import { useUpdateChatConfig } from "@/hooks/useAgentConfig";
import { ChatPoliciesSection } from "../sections/ChatPoliciesSection";

interface ChatPoliciesTabProps {
  agent: AgentFullResponse;
  onSaved: () => void;
}

export function ChatPoliciesTab({ agent, onSaved }: ChatPoliciesTabProps) {
  const initial: ChatConfig = { ...DEFAULT_CHAT_CONFIG, ...agent.chatConfig };
  const [config, setConfig] = useState<ChatConfig>(initial);
  const updateChatConfig = useUpdateChatConfig();

  const isDirty = JSON.stringify(config) !== JSON.stringify(initial);

  const handleSave = useCallback(async () => {
    const cleanConfig: ChatConfig = {
      ...config,
      groupConfigs: (config.groupConfigs ?? [])
        .filter((g) => g.groupId.trim())
        .map((g) => ({
          ...g,
          topicConfigs: (g.topicConfigs ?? []).filter((t) => t.topicId.trim()),
        })),
    };
    await updateChatConfig.mutateAsync({ agentId: agent.id, chatConfig: cleanConfig });
    onSaved();
  }, [agent.id, config, updateChatConfig, onSaved]);

  return (
    <div className="space-y-6 max-w-2xl">
      <ChatPoliciesSection config={config} onChange={setConfig} />

      {isDirty && (
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={updateChatConfig.isPending}
          >
            {updateChatConfig.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfig(initial)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
