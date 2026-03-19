"use client";

import { useCallback, useState } from "react";

import type { AgentFullResponse } from "@/types/agent-config";
import {
  useAgentSkills,
  useSkillsCatalog,
  useUpdateAgentSkills,
} from "@/hooks/useAgentConfig";

interface SkillsTabProps {
  agentId: string;
  agent: AgentFullResponse;
  onSaved: () => void;
}

export function SkillsTab({ agentId, agent, onSaved }: SkillsTabProps) {
  const { data: serverSkills, isLoading: skillsLoading } = useAgentSkills(agentId);
  const { data: catalogData, isLoading: catalogLoading } = useSkillsCatalog();
  const updateSkills = useUpdateAgentSkills();

  const initial = serverSkills ?? agent.enabledSkills ?? [];
  const [enabledSkills, setEnabledSkills] = useState<string[]>(initial);

  // Sync local state when server data loads
  const [lastServerSkills, setLastServerSkills] = useState<string[] | undefined>(undefined);
  if (serverSkills && serverSkills !== lastServerSkills) {
    setLastServerSkills(serverSkills);
    setEnabledSkills(serverSkills);
  }

  const isDirty =
    JSON.stringify([...enabledSkills].sort()) !== JSON.stringify([...initial].sort());

  const handleSave = useCallback(async () => {
    await updateSkills.mutateAsync({ agentId, enabledSkills });
    onSaved();
  }, [agentId, enabledSkills, updateSkills, onSaved]);

  const isLoading = skillsLoading || catalogLoading;
  const catalog = catalogData?.skills ?? [];

  // Skills enabled but not in catalog (e.g., manually added or catalog stale)
  const orphanedSkills = enabledSkills.filter(
    (id) => !catalog.some((s) => s.skillId === id),
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-medium mb-3">
          Agent Skills ({enabledSkills.length} enabled)
        </h3>

        {isLoading ? (
          <span className="loading loading-spinner loading-md" />
        ) : catalog.length > 0 ? (
          <div className="grid grid-cols-1 gap-1">
            {catalog.map((skill) => (
              <label
                key={skill.skillId}
                className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-base-300"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary mt-0.5"
                  checked={enabledSkills.includes(skill.skillId)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...enabledSkills, skill.skillId]
                      : enabledSkills.filter((id) => id !== skill.skillId);
                    setEnabledSkills(next);
                  }}
                />
                <div>
                  <span className="text-sm font-medium">{skill.name}</span>
                  {skill.description && (
                    <p className="text-xs text-base-content/50">{skill.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-base-content/40">No skills available</p>
        )}

        {orphanedSkills.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-base-content/60 mb-2">
              Other enabled skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {orphanedSkills.map((id) => (
                <div key={id} className="badge badge-lg gap-2">
                  <span className="font-mono text-xs">{id}</span>
                  <button
                    className="btn btn-ghost btn-xs px-0"
                    onClick={() =>
                      setEnabledSkills((prev) => prev.filter((s) => s !== id))
                    }
                    aria-label={`Remove ${id}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isDirty && (
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={updateSkills.isPending}
          >
            {updateSkills.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setEnabledSkills(initial)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
