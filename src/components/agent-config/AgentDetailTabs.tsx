"use client";

/**
 * AgentDetailTabs
 *
 * Tabbed detail view for a selected agent.
 * Tabs: General | Platform | Features | Chat | Tools | Personality
 */
import { useState } from "react";

import { useAgentDetails } from "@/hooks/useAgentDeploy";
import {
  useDeleteAgent,
  useToggleAgent,
} from "@/hooks/useAgentConfig";
import { ConfirmModal } from "@/components/common/Modal";

import { GeneralTab } from "./tabs/GeneralTab";
import { DeploymentTab } from "./tabs/DeploymentTab";
import { FeaturesTab } from "./tabs/FeaturesTab";
import { ChatPoliciesTab } from "./tabs/ChatPoliciesTab";
import { ToolsTab } from "./tabs/ToolsTab";
import { PersonalityTab } from "./tabs/PersonalityTab";
import { SkillsTab } from "./tabs/SkillsTab";
const TABS = [
  "General",
  "Platform",
  "Chat",
  "Features",
  "Tools",
  "Skills",
  "Personality",
] as const;

type TabName = (typeof TABS)[number];

interface AgentDetailTabsProps {
  agentId: string;
  bonfireId: string;
  onDeleted: () => void;
}

export function AgentDetailTabs({
  agentId,
  bonfireId,
  onDeleted,
}: AgentDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabName>("General");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { data: agent, isLoading, refetch } = useAgentDetails(agentId);
  const deleteAgent = useDeleteAgent();
  const toggleAgent = useToggleAgent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="alert alert-error">
        <span>Failed to load agent details</span>
      </div>
    );
  }

  const handleToggle = async () => {
    await toggleAgent.mutateAsync({ agentId, isActive: !agent.is_active });
    refetch();
  };

  const handleDelete = async () => {
    await deleteAgent.mutateAsync(agentId);
    onDeleted();
  };

  return (
    <div className="border border-base-300 rounded-lg bg-base-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{agent.name}</h2>
          <p className="text-sm text-base-content/50">@{agent.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`btn btn-sm ${agent.is_active ? "btn-warning" : "btn-success"}`}
            onClick={handleToggle}
            disabled={toggleAgent.isPending}
          >
            {agent.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            className="btn btn-sm btn-error btn-outline"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={deleteAgent.isPending}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-base-300">
        <div role="tablist" className="tabs tabs-bordered px-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              className={`tab ${activeTab === tab ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === "General" && <GeneralTab agent={agent} onSaved={refetch} />}
        {activeTab === "Platform" && <DeploymentTab agent={agent} onSaved={refetch} />}
        {activeTab === "Features" && <FeaturesTab agent={agent} onSaved={refetch} />}
        {activeTab === "Chat" && <ChatPoliciesTab agent={agent} onSaved={refetch} />}
        {activeTab === "Tools" && <ToolsTab agentId={agentId} agent={agent} onSaved={refetch} />}
        {activeTab === "Skills" && <SkillsTab agentId={agentId} agent={agent} onSaved={refetch} />}
        {activeTab === "Personality" && <PersonalityTab agentId={agentId} />}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Agent"
        message={`Are you sure you want to deactivate and unregister "${agent.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="error"
        loading={deleteAgent.isPending}
      />
    </div>
  );
}
