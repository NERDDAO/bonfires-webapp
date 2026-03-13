"use client";

import { useCallback, useState } from "react";

import type { AgentFullResponse, AgentPlatform } from "@/types/agent-config";
import { useUpdateAgent } from "@/hooks/useAgentDeploy";
import { DeploymentSection } from "../sections/DeploymentSection";

interface DeploymentTabProps {
  agent: AgentFullResponse;
  onSaved: () => void;
}

export function DeploymentTab({ agent, onSaved }: DeploymentTabProps) {
  const deploy = agent.deploymentConfiguration;
  const updateAgent = useUpdateAgent();

  const [platform, setPlatform] = useState<AgentPlatform>(deploy?.platform ?? "telegram");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [discordBotToken, setDiscordBotToken] = useState("");
  const [reportingConfig, setReportingConfig] = useState(deploy?.reportingConfig ?? null);

  // Sync local state when the agent prop changes (e.g., switching agents or refetch)
  const [lastAgentId, setLastAgentId] = useState(agent.id);
  if (agent.id !== lastAgentId) {
    setLastAgentId(agent.id);
    setPlatform(deploy?.platform ?? "telegram");
    setTelegramBotToken("");
    setDiscordBotToken("");
    setReportingConfig(deploy?.reportingConfig ?? null);
  }

  const isDirty =
    platform !== (deploy?.platform ?? "telegram") ||
    telegramBotToken !== "" ||
    discordBotToken !== "" ||
    JSON.stringify(reportingConfig) !== JSON.stringify(deploy?.reportingConfig ?? null);

  const handleSave = useCallback(async () => {
    const deploymentConfiguration: Record<string, unknown> = {
      ...deploy,
      platform,
      reportingConfig: reportingConfig ?? undefined,
    };
    if (telegramBotToken) deploymentConfiguration["telegramBotToken"] = telegramBotToken;
    if (discordBotToken) deploymentConfiguration["discordBotToken"] = discordBotToken;

    await updateAgent.mutateAsync({ agentId: agent.id, data: { deploymentConfiguration } });
    setTelegramBotToken("");
    setDiscordBotToken("");
    onSaved();
  }, [agent.id, deploy, platform, telegramBotToken, discordBotToken, reportingConfig, updateAgent, onSaved]);

  return (
    <div className="space-y-4 max-w-2xl">
      <DeploymentSection
        platform={platform}
        telegramBotToken={telegramBotToken}
        discordBotToken={discordBotToken}
        reportingConfig={reportingConfig}
        telegramTokenConfigured={!!deploy?.telegramBotToken}
        discordTokenConfigured={!!deploy?.discordBotToken}
        onChange={(patch) => {
          if (patch.platform !== undefined) setPlatform(patch.platform);
          if (patch.telegramBotToken !== undefined) setTelegramBotToken(patch.telegramBotToken);
          if (patch.discordBotToken !== undefined) setDiscordBotToken(patch.discordBotToken);
          if ("reportingConfig" in patch) setReportingConfig(patch.reportingConfig ?? null);
        }}
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
              setPlatform(deploy?.platform ?? "telegram");
              setTelegramBotToken("");
              setDiscordBotToken("");
              setReportingConfig(deploy?.reportingConfig ?? null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
