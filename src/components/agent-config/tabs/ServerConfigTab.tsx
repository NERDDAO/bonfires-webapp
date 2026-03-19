"use client";

import { useCallback, useState } from "react";

import type {
  AgentFullResponse,
  GroupConfig,
  TopicConfig,
} from "@/types/agent-config";
import { useUpdateAgent } from "@/hooks/useAgentDeploy";

interface ServerConfigTabProps {
  agent: AgentFullResponse;
  onSaved: () => void;
}

function emptyGroup(): GroupConfig {
  return {
    groupId: "",
    status: "enabled",
    topicPolicy: "open",
    silentMode: false,
    disableStoring: false,
    topicConfigs: [],
  };
}

function emptyTopic(): TopicConfig {
  return {
    topicId: "",
    status: "enabled",
    silentMode: false,
    disableStoring: false,
  };
}

export function ServerConfigTab({ agent, onSaved }: ServerConfigTabProps) {
  const initial = agent.chatConfig?.groupConfigs ?? [];
  const [groups, setGroups] = useState<GroupConfig[]>(
    initial.map((g) => ({ ...emptyGroup(), ...g, topicConfigs: (g.topicConfigs ?? []).map((t) => ({ ...emptyTopic(), ...t })) })),
  );
  const updateAgent = useUpdateAgent();

  const isDirty = JSON.stringify(groups) !== JSON.stringify(initial);

  const updateGroup = (index: number, patch: Partial<GroupConfig>) => {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const removeGroup = (index: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, emptyGroup()]);
  };

  const updateTopic = (groupIndex: number, topicIndex: number, patch: Partial<TopicConfig>) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? {
              ...g,
              topicConfigs: (g.topicConfigs ?? []).map((t, ti) =>
                ti === topicIndex ? { ...t, ...patch } : t,
              ),
            }
          : g,
      ),
    );
  };

  const removeTopic = (groupIndex: number, topicIndex: number) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? { ...g, topicConfigs: (g.topicConfigs ?? []).filter((_, ti) => ti !== topicIndex) }
          : g,
      ),
    );
  };

  const addTopic = (groupIndex: number) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? { ...g, topicConfigs: [...(g.topicConfigs ?? []), emptyTopic()] }
          : g,
      ),
    );
  };

  const handleSave = useCallback(async () => {
    const cleanGroups = groups
      .filter((g) => g.groupId.trim())
      .map((g) => ({
        ...g,
        topicConfigs: (g.topicConfigs ?? []).filter((t) => t.topicId.trim()),
      }));

    await updateAgent.mutateAsync({
      agentId: agent.id,
      data: {
        chatConfig: {
          ...agent.chatConfig,
          groupConfigs: cleanGroups,
        },
      },
    });
    onSaved();
  }, [agent.id, agent.chatConfig, groups, updateAgent, onSaved]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Server Configurations ({groups.length})</h3>
        <button className="btn btn-sm btn-primary" onClick={addGroup}>
          Add Server
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-base-content/40">
          No server configurations. Click &quot;Add Server&quot; to create one.
        </p>
      )}

      {groups.map((group, gi) => (
        <div key={gi} className="border border-base-300 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              Server {gi + 1}{group.groupId ? ` — ${group.groupId}` : ""}
            </h4>
            <button
              className="btn btn-xs btn-error btn-outline"
              onClick={() => removeGroup(gi)}
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">Group ID <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                className={`input input-bordered input-sm ${!group.groupId.trim() ? "input-warning" : ""}`}
                placeholder="Telegram group ID or Discord server ID"
                value={group.groupId}
                onChange={(e) => updateGroup(gi, { groupId: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">Status</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={group.status ?? "enabled"}
                onChange={(e) =>
                  updateGroup(gi, { status: e.target.value as "enabled" | "disabled" })
                }
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm">Topic Policy</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={group.topicPolicy ?? "open"}
                onChange={(e) =>
                  updateGroup(gi, { topicPolicy: e.target.value as "open" | "restricted" })
                }
              >
                <option value="open">Open</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={!!group.silentMode}
                onChange={(e) => updateGroup(gi, { silentMode: e.target.checked })}
              />
              <span className="label-text text-sm">Silent Mode</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={!!group.disableStoring}
                onChange={(e) => updateGroup(gi, { disableStoring: e.target.checked })}
              />
              <span className="label-text text-sm">Disable Storing</span>
            </label>
          </div>

          {/* Topic Configs */}
          <div className="border-t border-base-300 pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-base-content/60">
                Topic Configs ({(group.topicConfigs ?? []).length})
              </span>
              <button
                className="btn btn-xs btn-outline"
                onClick={() => addTopic(gi)}
              >
                Add Topic
              </button>
            </div>

            {(group.topicConfigs ?? []).length === 0 && (
              <p className="text-xs text-base-content/40">No topic configs</p>
            )}

            {(group.topicConfigs ?? []).map((topic, ti) => (
              <div key={ti} className="bg-base-300 rounded p-2 mb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Topic {ti + 1}</span>
                  <button
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => removeTopic(gi, ti)}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-xs"
                    placeholder="Topic ID"
                    value={topic.topicId}
                    onChange={(e) => updateTopic(gi, ti, { topicId: e.target.value })}
                  />
                  <select
                    className="select select-bordered select-xs"
                    value={topic.status ?? "enabled"}
                    onChange={(e) =>
                      updateTopic(gi, ti, { status: e.target.value as "enabled" | "disabled" })
                    }
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={!!topic.silentMode}
                      onChange={(e) => updateTopic(gi, ti, { silentMode: e.target.checked })}
                    />
                    <span className="text-xs">Silent</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={!!topic.disableStoring}
                      onChange={(e) => updateTopic(gi, ti, { disableStoring: e.target.checked })}
                    />
                    <span className="text-xs">Disable Storing</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

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
            onClick={() =>
              setGroups(
                initial.map((g) => ({
                  ...emptyGroup(),
                  ...g,
                  topicConfigs: (g.topicConfigs ?? []).map((t) => ({ ...emptyTopic(), ...t })),
                })),
              )
            }
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
