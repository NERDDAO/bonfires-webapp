"use client";

import type { AgentFeatures } from "@/types/agent-config";

const TOGGLE_KEYS = [
  ["isImageInputEnabled", "Image Input"],
  ["isAudioInputEnabled", "Audio Input"],
  ["isDocumentInputEnabled", "Document Input"],
  ["isImageGenerationEnabled", "Image Generation"],
  ["allowScheduling", "Task Scheduling"],
] as const;

interface FeaturesSectionProps {
  features: AgentFeatures;
  onChange: (features: AgentFeatures) => void;
  isAdmin?: boolean;
}

export function FeaturesSection({ features, onChange, isAdmin }: FeaturesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOGGLE_KEYS.map(([key, label]) => (
          <label key={key} className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={!!features[key]}
              onChange={(e) => onChange({ ...features, [key]: e.target.checked })}
            />
            <span className="label-text">{label}</span>
          </label>
        ))}
      </div>

      {features.isImageGenerationEnabled && (
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Default Image Generation Model</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={features.defaultImageGenerationModel}
            onChange={(e) =>
              onChange({ ...features, defaultImageGenerationModel: e.target.value })
            }
          />
        </div>
      )}

      {isAdmin && (
        <div className="border-t border-base-300 pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-3 text-base-content/70">
            Advanced (Admin Only)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Max Tool Iterations</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                min={1}
                step={1}
                placeholder="Default: 5"
                value={features.maxToolIterations ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...features,
                    maxToolIterations: val === "" ? null : Math.max(1, parseInt(val, 10)),
                  } as AgentFeatures);
                }}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  Max LLM tool-use loops per message
                </span>
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Max Parallel Tool Calls</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                min={1}
                step={1}
                placeholder="Default: 5"
                value={features.maxParallelToolCalls ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...features,
                    maxParallelToolCalls: val === "" ? null : Math.max(1, parseInt(val, 10)),
                  } as AgentFeatures);
                }}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  Max tools executed in parallel per iteration
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
