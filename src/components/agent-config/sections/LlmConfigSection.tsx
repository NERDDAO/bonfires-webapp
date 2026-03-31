"use client";

import { useEffect, useRef, useState } from "react";

import type { LlmConfig, LlmModelOption } from "@/types/agent-config";
import { useLlmModelsCatalog } from "@/hooks/useAgentConfig";

// ── Cost tier styling ────────────────────────────────────────────────────

const COST_TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  cheap: { bg: "bg-success/20", text: "text-success", label: "cheap" },
  moderate: { bg: "bg-warning/20", text: "text-warning", label: "moderate" },
  expensive: { bg: "bg-error/20", text: "text-error", label: "expensive" },
};

function CostBadge({ tier }: { tier: string }) {
  const style = COST_TIER_STYLES[tier] ?? {
    bg: "bg-base-content/10",
    text: "text-base-content/60",
    label: tier,
  };
  return (
    <span className={`badge badge-xs ${style.bg} ${style.text} border-0`}>
      {style.label}
    </span>
  );
}

// ── Model Dropdown ───────────────────────────────────────────────────────

interface ModelDropdownProps {
  value: string | null | undefined;
  models: LlmModelOption[];
  placeholder: string;
  onChange: (presetName: string | null) => void;
  isLoading?: boolean;
  dropUp?: boolean;
}

function ModelDropdown({ value, models, placeholder, onChange, isLoading, dropUp }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = models.find((m) => m.presetName === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input input-bordered input-sm w-full text-left flex items-center justify-between gap-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`truncate ${!selected ? "opacity-50" : ""}`}>
          {selected ? selected.presetName : placeholder}
        </span>
        {selected && <CostBadge tier={selected.costTier} />}
        {!selected && (
          <svg className="w-3 h-3 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className={`absolute z-50 left-0 right-0 bg-base-200 border border-base-300 rounded-box shadow-lg max-h-60 overflow-auto ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
          {isLoading ? (
            <div className="px-3 py-2 text-sm opacity-50">Loading models...</div>
          ) : models.length === 0 ? (
            <div className="px-3 py-2 text-sm opacity-50">No models available</div>
          ) : (
            <>
              {value && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm opacity-50 hover:bg-base-300"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  Clear selection
                </button>
              )}
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base-300 flex items-center justify-between gap-2 ${
                    model.presetName === value ? "bg-base-300 font-medium" : ""
                  }`}
                  onClick={() => {
                    onChange(model.presetName);
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate">{model.presetName}</div>
                    {model.shortDescription && (
                      <div className="text-xs opacity-50 truncate">{model.shortDescription}</div>
                    )}
                  </div>
                  <CostBadge tier={model.costTier} />
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Section ─────────────────────────────────────────────────────────

interface LlmConfigSectionProps {
  config: LlmConfig;
  onChange: (config: LlmConfig) => void;
}

export function LlmConfigSection({ config, onChange }: LlmConfigSectionProps) {
  const { data: models = [], isLoading } = useLlmModelsCatalog();

  // For the "Allowed Response Models" dropdown, filter out already-added models
  const availableResponseModels = models.filter(
    (m) => !(config.responseModels ?? []).includes(m.presetName),
  );

  const addResponseModel = (presetName: string | null) => {
    if (!presetName) return;
    if ((config.responseModels ?? []).includes(presetName)) return;
    onChange({ ...config, responseModels: [...(config.responseModels ?? []), presetName] });
  };

  const removeResponseModel = (model: string) => {
    onChange({
      ...config,
      responseModels: (config.responseModels ?? []).filter((m) => m !== model),
    });
  };

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Internal Model</span>
        </label>
        <ModelDropdown
          value={config.internalModel}
          models={models}
          placeholder="Select model preset..."
          onChange={(v) => onChange({ ...config, internalModel: v ?? undefined })}
          isLoading={isLoading}
        />
        <label className="label">
          <span className="label-text-alt text-base-content/50">
            Model preset for internal flow nodes (think, decide, assign labels, etc.)
          </span>
        </label>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Default Response Model</span>
        </label>
        <ModelDropdown
          value={config.defaultResponseModel}
          models={models}
          placeholder="Select model preset..."
          onChange={(v) => onChange({ ...config, defaultResponseModel: v ?? undefined })}
          isLoading={isLoading}
        />
        <label className="label">
          <span className="label-text-alt text-base-content/50">
            Default model for response generation
          </span>
        </label>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Allowed Response Models</span>
        </label>
        <ModelDropdown
          value={null}
          models={availableResponseModels}
          placeholder="Add model preset..."
          onChange={addResponseModel}
          isLoading={isLoading}
          dropUp
        />
        {(config.responseModels ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(config.responseModels ?? []).map((model) => {
              const modelInfo = models.find((m) => m.presetName === model);
              return (
                <span key={model} className="badge badge-outline gap-1.5">
                  {model}
                  {modelInfo && <CostBadge tier={modelInfo.costTier} />}
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs px-0"
                    onClick={() => removeResponseModel(model)}
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/50">
            Model presets the agent is allowed to use for responses
          </span>
        </label>
      </div>
    </div>
  );
}
