"use client";

import { useState } from "react";

import {
  useAgentEnvVars,
  useUpsertEnvVars,
  useDeleteEnvVar,
} from "@/hooks/useAgentConfig";

interface EnvVarsTabProps {
  agentId: string;
}

export function EnvVarsTab({ agentId }: EnvVarsTabProps) {
  const { data, isLoading } = useAgentEnvVars(agentId);
  const upsertEnvVars = useUpsertEnvVars();
  const deleteEnvVar = useDeleteEnvVar();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = async () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) return;

    await upsertEnvVars.mutateAsync({
      agentId,
      vars: { [key]: value },
    });
    setNewKey("");
    setNewValue("");
  };

  const handleUpdate = async (key: string) => {
    if (!editValue.trim()) return;
    await upsertEnvVars.mutateAsync({
      agentId,
      vars: { [key]: editValue.trim() },
    });
    setEditingKey(null);
    setEditValue("");
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete env var "${key}"?`)) return;
    await deleteEnvVar.mutateAsync({ agentId, key });
  };

  if (isLoading) {
    return <span className="loading loading-spinner loading-md" />;
  }

  const vars = data?.vars ?? [];

  return (
    <div className="space-y-4 max-w-2xl">
      <h3 className="font-medium">
        Environment Variables ({vars.length})
      </h3>

      {/* Existing vars */}
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
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(v.key)}
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
                          onClick={() => handleUpdate(v.key)}
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
                          onClick={() => handleDelete(v.key)}
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

      {/* Add new var */}
      <div className="border border-base-300 rounded-lg p-3">
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
            onClick={handleAdd}
            disabled={!newKey.trim() || !newValue.trim() || upsertEnvVars.isPending}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
