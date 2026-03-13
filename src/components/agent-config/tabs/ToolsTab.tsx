"use client";

import { useCallback, useState } from "react";

import type { AgentFullResponse } from "@/types/agent-config";
import { useUpdateAgent } from "@/hooks/useAgentDeploy";
import {
  useToolsCatalog,
  useAgentEnvVars,
  useUpsertEnvVars,
  useDeleteEnvVar,
} from "@/hooks/useAgentConfig";
import { ConfirmModal } from "@/components/common/Modal";
import { McpToolsSection } from "../sections/McpToolsSection";

interface ToolsTabProps {
  agentId: string;
  agent: AgentFullResponse;
  onSaved: () => void;
}

export function ToolsTab({ agentId, agent, onSaved }: ToolsTabProps) {
  const { data: toolsData, isLoading: toolsLoading } = useToolsCatalog();
  const updateAgent = useUpdateAgent();

  const [enabledTools, setEnabledTools] = useState<string[]>(
    agent.enabledMcpTools ?? [],
  );

  const isDirty =
    JSON.stringify(enabledTools.sort()) !==
    JSON.stringify((agent.enabledMcpTools ?? []).sort());

  const handleSave = useCallback(async () => {
    await updateAgent.mutateAsync({
      agentId: agent.id,
      data: { enabledMcpTools: enabledTools },
    });
    onSaved();
  }, [agent.id, enabledTools, updateAgent, onSaved]);

  // ── Env Vars ──────────────────────────────────────────────────────────────

  const { data: envData, isLoading: envLoading } = useAgentEnvVars(agentId);
  const upsertEnvVars = useUpsertEnvVars();
  const deleteEnvVar = useDeleteEnvVar();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);

  const handleEnvAdd = async () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) return;
    await upsertEnvVars.mutateAsync({ agentId, vars: { [key]: value } });
    setNewKey("");
    setNewValue("");
  };

  const handleEnvUpdate = async (key: string) => {
    if (!editValue.trim()) return;
    await upsertEnvVars.mutateAsync({ agentId, vars: { [key]: editValue.trim() } });
    setEditingKey(null);
    setEditValue("");
  };

  const handleEnvDelete = async () => {
    if (!deleteConfirmKey) return;
    await deleteEnvVar.mutateAsync({ agentId, key: deleteConfirmKey });
    setDeleteConfirmKey(null);
  };

  const vars = envData?.vars ?? [];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* ── MCP Tools ─────────────────────────────────────────────────────── */}
      <div>
        <h3 className="font-medium mb-3">
          MCP Tools ({enabledTools.length} enabled)
        </h3>

        <McpToolsSection
          tools={toolsData?.tools ?? []}
          enabledTools={enabledTools}
          onChange={setEnabledTools}
          isLoading={toolsLoading}
        />

        {isDirty && (
          <div className="flex gap-2 mt-4">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={updateAgent.isPending}
            >
              {updateAgent.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setEnabledTools(agent.enabledMcpTools ?? [])}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* ── Environment Variables ─────────────────────────────────────────── */}
      <div>
        <h3 className="font-medium mb-3">
          Environment Variables ({vars.length})
        </h3>

        {envLoading ? (
          <span className="loading loading-spinner loading-md" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vars.map((v) => (
                    <tr key={v.key}>
                      <td className="font-mono text-sm">{v.key}</td>
                      <td>
                        {editingKey === v.key ? (
                          <input
                            type="text"
                            className="input input-bordered input-xs w-full"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleEnvUpdate(v.key)}
                            autoFocus
                          />
                        ) : (
                          <span className="text-base-content/40">
                            {v.has_value ? "••••••••" : "(empty)"}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {editingKey === v.key ? (
                            <>
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => handleEnvUpdate(v.key)}
                                disabled={upsertEnvVars.isPending}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-xs btn-ghost"
                                onClick={() => setEditingKey(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-xs btn-ghost"
                                onClick={() => {
                                  setEditingKey(v.key);
                                  setEditValue("");
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-xs btn-error btn-outline"
                                onClick={() => setDeleteConfirmKey(v.key)}
                                disabled={deleteEnvVar.isPending}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vars.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-base-content/40">
                        No environment variables configured
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border border-base-300 rounded-lg p-3 mt-4">
              <h4 className="text-sm font-medium mb-2">Add Variable</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1"
                  placeholder="KEY"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                />
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1"
                  placeholder="value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleEnvAdd}
                  disabled={!newKey.trim() || !newValue.trim() || upsertEnvVars.isPending}
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmKey}
        onClose={() => setDeleteConfirmKey(null)}
        onConfirm={handleEnvDelete}
        title="Delete Variable"
        message={`Delete env var "${deleteConfirmKey}"?`}
        confirmText="Delete"
        variant="error"
        loading={deleteEnvVar.isPending}
      />
    </div>
  );
}
