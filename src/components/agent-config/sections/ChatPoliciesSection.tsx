"use client";

import { useState } from "react";

import type { ChatConfig, GroupConfig, TopicConfig } from "@/types/agent-config";

// ── Internal: User list editor ─────────────────────────────────────────────

function UserListEditor({
  label,
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (item: string) => void;
}) {
  return (
    <div>
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>
      <div className="flex flex-wrap gap-1 mb-2">
        {items.map((u) => (
          <div key={u} className="badge badge-sm gap-1">
            {u}
            <button className="btn btn-ghost btn-xs px-0" onClick={() => onRemove(u)}>
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && <span className="text-base-content/40 text-xs">None</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-bordered input-xs flex-1"
          placeholder="Add user ID..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button className="btn btn-xs btn-outline" onClick={onAdd}>
          Add
        </button>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

interface ChatPoliciesSectionProps {
  config: ChatConfig;
  onChange: (config: ChatConfig) => void;
}

export function ChatPoliciesSection({ config, onChange }: ChatPoliciesSectionProps) {
  const [newAllowedUser, setNewAllowedUser] = useState("");
  const [newSchedulingUser, setNewSchedulingUser] = useState("");
  const [newDmsStoreUser, setNewDmsStoreUser] = useState("");

  const patch = (p: Partial<ChatConfig>) => onChange({ ...config, ...p });

  const addToList = (
    field: "allowedUsers" | "schedulingAllowedUsers" | "allowedUsersDMsStore",
    value: string,
    setter: (v: string) => void,
  ) => {
    const trimmed = value.trim();
    if (trimmed && !(config[field] ?? []).includes(trimmed)) {
      patch({ [field]: [...(config[field] ?? []), trimmed] });
      setter("");
    }
  };

  const removeFromList = (
    field: "allowedUsers" | "schedulingAllowedUsers" | "allowedUsersDMsStore",
    value: string,
  ) => {
    patch({ [field]: (config[field] ?? []).filter((u) => u !== value) });
  };

  const addGroup = () =>
    patch({
      groupConfigs: [
        ...(config.groupConfigs ?? []),
        {
          groupId: "",
          status: "enabled" as const,
          topicPolicy: "open" as const,
          silentMode: false,
          disableStoring: false,
          topicConfigs: [],
        },
      ],
    });

  const removeGroup = (i: number) =>
    patch({ groupConfigs: (config.groupConfigs ?? []).filter((_, idx) => idx !== i) });

  const updateGroup = (i: number, p: Partial<GroupConfig>) =>
    patch({
      groupConfigs: (config.groupConfigs ?? []).map((g, idx) =>
        idx === i ? { ...g, ...p } : g,
      ),
    });

  const addTopicToGroup = (gi: number) =>
    patch({
      groupConfigs: (config.groupConfigs ?? []).map((g, idx) =>
        idx === gi
          ? {
              ...g,
              topicConfigs: [
                ...(g.topicConfigs ?? []),
                { topicId: "", status: "enabled" as const, silentMode: false, disableStoring: false },
              ],
            }
          : g,
      ),
    });

  const removeTopic = (gi: number, ti: number) =>
    patch({
      groupConfigs: (config.groupConfigs ?? []).map((g, idx) =>
        idx === gi
          ? { ...g, topicConfigs: (g.topicConfigs ?? []).filter((_, i) => i !== ti) }
          : g,
      ),
    });

  const updateTopic = (gi: number, ti: number, p: Partial<TopicConfig>) =>
    patch({
      groupConfigs: (config.groupConfigs ?? []).map((g, idx) =>
        idx === gi
          ? {
              ...g,
              topicConfigs: (g.topicConfigs ?? []).map((t, i) => (i === ti ? { ...t, ...p } : t)),
            }
          : g,
      ),
    });

  const groups = config.groupConfigs ?? [];

  return (
    <div className="space-y-4">
      {/* Policies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Group Policy</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={config.groupPolicy ?? "open"}
            onChange={(e) => patch({ groupPolicy: e.target.value as "open" | "restricted" })}
          >
            <option value="open">Open</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">DM Policy</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={config.dmPolicy ?? "open"}
            onChange={(e) =>
              patch({ dmPolicy: e.target.value as "open" | "restricted" | "disabled" })
            }
          >
            <option value="open">Open</option>
            <option value="restricted">Restricted</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={!!config.silentMode}
            onChange={(e) => patch({ silentMode: e.target.checked })}
          />
          <span className="label-text">Silent Mode</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={!!config.disableStoringGroups}
            onChange={(e) => patch({ disableStoringGroups: e.target.checked })}
          />
          <span className="label-text">Disable Storing Group Messages</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={!!config.disableStoringDMs}
            onChange={(e) => patch({ disableStoringDMs: e.target.checked })}
          />
          <span className="label-text">Disable Storing DM Messages</span>
        </label>
      </div>

      <div className="divider text-xs">User Lists</div>

      <div className="space-y-4">
        <UserListEditor
          label="Allowed Users"
          items={config.allowedUsers ?? []}
          inputValue={newAllowedUser}
          onInputChange={setNewAllowedUser}
          onAdd={() => addToList("allowedUsers", newAllowedUser, setNewAllowedUser)}
          onRemove={(u) => removeFromList("allowedUsers", u)}
        />
        <UserListEditor
          label="Scheduling Allowed Users"
          items={config.schedulingAllowedUsers ?? []}
          inputValue={newSchedulingUser}
          onInputChange={setNewSchedulingUser}
          onAdd={() =>
            addToList("schedulingAllowedUsers", newSchedulingUser, setNewSchedulingUser)
          }
          onRemove={(u) => removeFromList("schedulingAllowedUsers", u)}
        />
        <UserListEditor
          label="DMs Store Allowed Users"
          items={config.allowedUsersDMsStore ?? []}
          inputValue={newDmsStoreUser}
          onInputChange={setNewDmsStoreUser}
          onAdd={() =>
            addToList("allowedUsersDMsStore", newDmsStoreUser, setNewDmsStoreUser)
          }
          onRemove={(u) => removeFromList("allowedUsersDMsStore", u)}
        />
      </div>

      <div className="divider text-xs">Server Configurations</div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-base-content/60">
            {groups.length} server{groups.length !== 1 ? "s" : ""} configured
          </span>
          <button className="btn btn-sm btn-outline" onClick={addGroup}>
            Add Server
          </button>
        </div>

        {groups.length === 0 && (
          <p className="text-sm text-base-content/40">
            No server configurations. Click &quot;Add Server&quot; to create one.
          </p>
        )}

        {groups.map((group, gi) => (
          <div key={gi} className="border border-base-300 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Server {gi + 1}
                {group.groupId ? ` — ${group.groupId}` : ""}
              </h4>
              <button className="btn btn-xs btn-error btn-outline" onClick={() => removeGroup(gi)}>
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-sm">
                    Group ID <span className="text-error">*</span>
                  </span>
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

            <div className="border-t border-base-300 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-base-content/60">
                  Topic Configs ({(group.topicConfigs ?? []).length})
                </span>
                <button className="btn btn-xs btn-outline" onClick={() => addTopicToGroup(gi)}>
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
                        onChange={(e) =>
                          updateTopic(gi, ti, { disableStoring: e.target.checked })
                        }
                      />
                      <span className="text-xs">Disable Storing</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
