"use client";

/**
 * AgentList
 *
 * Left panel showing all agents for the current bonfire.
 * Active/inactive badges, click to select, "New Agent" button.
 */

import type { AgentInfo } from "@/types";

interface AgentListProps {
  agents: AgentInfo[];
  isLoading: boolean;
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onCreateAgent: () => void;
}

export function AgentList({
  agents,
  isLoading,
  selectedAgentId,
  onSelectAgent,
  onCreateAgent,
}: AgentListProps) {
  return (
    <div className="border border-base-300 rounded-lg bg-base-200 overflow-hidden">
      <div className="p-3 border-b border-base-300 flex items-center justify-between">
        <h2 className="font-semibold text-sm">Agents ({agents.length})</h2>
        <button className="btn btn-primary btn-xs" onClick={onCreateAgent}>
          + New
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : agents.length === 0 ? (
          <div className="p-4 text-center text-base-content/40 text-sm">
            No agents yet. Create your first agent.
          </div>
        ) : (
          <ul className="menu menu-md p-1 gap-0.5 w-full">
            {agents.map((agent) => (
              <li key={agent.id} className="w-full">
                <button
                  className={`flex items-center gap-2 text-left w-full ${
                    selectedAgentId === agent.id ? "active" : ""
                  }`}
                  onClick={() => onSelectAgent(agent.id)}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      agent.is_active ? "bg-success" : "bg-base-content/20"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{agent.name}</div>
                    <div className="text-xs text-base-content/50 truncate">
                      @{agent.username}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
