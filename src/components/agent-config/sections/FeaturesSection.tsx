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
}

export function FeaturesSection({ features, onChange }: FeaturesSectionProps) {
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
    </div>
  );
}
