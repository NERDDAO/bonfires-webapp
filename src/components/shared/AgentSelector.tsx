"use client";

/**
 * AgentSelector Component
 *
 * Unified bonfire/agent selection component with DaisyUI styling.
 * Supports compact and default variants.
 */
import type { AgentSelectionState } from "@/types";

interface AgentSelectorProps {
  state: AgentSelectionState;
  onBonfireChange: (bonfireId: string | null) => void;
  onAgentChange: (agentId: string | null) => void;
  variant?: "default" | "compact";
  showAgentSelector?: boolean;
}

export function AgentSelector({
  state,
  onBonfireChange,
  onAgentChange,
  variant = "default",
  showAgentSelector = true,
}: AgentSelectorProps) {
  const {
    availableBonfires,
    availableAgents,
    selectedBonfire,
    selectedAgent,
    loading,
    error,
  } = state;

  const isCompact = variant === "compact";

  return (
    <div
      className={`flex ${isCompact ? "flex-row gap-2" : "flex-col gap-4"} w-full`}
    >
      {/* Bonfire Selector */}
      <div className={`form-control ${isCompact ? "flex-1" : "w-full"}`}>
        {!isCompact && (
          <label className="label">
            <span className="label-text font-semibold">Bonfire</span>
          </label>
        )}
        {loading.bonfires ? (
          <div className="skeleton h-12 w-full"></div>
        ) : error.bonfires ? (
          <div className="alert alert-error text-sm">
            <span>{error.bonfires}</span>
          </div>
        ) : (
          <select
            className={`select select-bordered w-full ${isCompact ? "select-sm" : ""}`}
            value={selectedBonfire?.id || ""}
            onChange={(e) => onBonfireChange(e.target.value || null)}
          >
            <option value="">Select Bonfire</option>
            {availableBonfires.map((bonfire) => (
              <option key={bonfire.id} value={bonfire.id}>
                {bonfire.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Agent Selector */}
      {showAgentSelector && (
        <div className={`form-control ${isCompact ? "flex-1" : "w-full"}`}>
          {!isCompact && (
            <label className="label">
              <span className="label-text font-semibold">Agent</span>
            </label>
          )}
          {loading.agents ? (
            <div className="skeleton h-12 w-full"></div>
          ) : error.agents ? (
            <div className="alert alert-error text-sm">
              <span>{error.agents}</span>
            </div>
          ) : (
            <select
              className={`select select-bordered w-full ${isCompact ? "select-sm" : ""}`}
              value={selectedAgent?.id || ""}
              onChange={(e) => onAgentChange(e.target.value || null)}
              disabled={!selectedBonfire || availableAgents.length === 0}
            >
              <option value="">
                {!selectedBonfire
                  ? "Select bonfire first"
                  : availableAgents.length === 0
                    ? "No agents available"
                    : "Select Agent"}
              </option>
              {availableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || agent.username || agent.id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
