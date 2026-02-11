"use client";

/**
 * HTNTemplateCreator Component
 *
 * Modal form for creating a custom HTN template.
 * Supports defining prompts, node configurations, and length variants.
 */
import { useCallback, useState } from "react";

import type { CreateHTNTemplateRequest } from "@/types";

import { useCreateHTNTemplate } from "@/hooks/mutations";

import { Modal } from "@/components/ui/modal";

interface HTNTemplateCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (templateId: string) => void;
}

interface LengthConfig {
  enabled: boolean;
  maxNodes: number;
  maxWords: number;
  description: string;
}

const INITIAL_LENGTH_CONFIGS: Record<string, LengthConfig> = {
  short: {
    enabled: true,
    maxNodes: 4,
    maxWords: 300,
    description: "Concise content with fewer sections",
  },
  medium: {
    enabled: true,
    maxNodes: 7,
    maxWords: 400,
    description: "Standard content with balanced sections",
  },
  long: {
    enabled: false,
    maxNodes: 12,
    maxWords: 500,
    description: "Comprehensive content with many sections",
  },
};

const PLACEHOLDER_HINTS = [
  "{user_query}",
  "{dataroom_description}",
  "{formatted_context}",
  "{max_nodes}",
  "{max_words}",
  "{length_guide}",
  "{dataroom_system_prompt}",
];

export function HTNTemplateCreator({
  isOpen,
  onClose,
  onCreated,
}: HTNTemplateCreatorProps) {
  const [name, setName] = useState("");
  const [templateType, setTemplateType] = useState("blog");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPromptTemplate, setUserPromptTemplate] = useState("");
  const [defaultLength, setDefaultLength] = useState("medium");
  const [lengthConfigs, setLengthConfigs] = useState<
    Record<string, LengthConfig>
  >(() => structuredClone(INITIAL_LENGTH_CONFIGS));
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateHTNTemplate();

  const resetForm = useCallback(() => {
    setName("");
    setTemplateType("blog");
    setDescription("");
    setSystemPrompt("");
    setUserPromptTemplate("");
    setDefaultLength("medium");
    setLengthConfigs(structuredClone(INITIAL_LENGTH_CONFIGS));
    setFormError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const updateLengthConfig = (
    length: string,
    field: keyof LengthConfig,
    value: string | boolean | number
  ) => {
    setLengthConfigs((prev) => {
      const fallback: LengthConfig = { enabled: false, maxNodes: 7, maxWords: 400, description: "" };
      const current: LengthConfig = prev[length] ?? fallback;
      const updated: LengthConfig = {
        enabled: field === "enabled" ? (value as boolean) : current.enabled,
        maxNodes: field === "maxNodes" ? (value as number) : current.maxNodes,
        maxWords: field === "maxWords" ? (value as number) : current.maxWords,
        description: field === "description" ? (value as string) : current.description,
      };
      return { ...prev, [length]: updated };
    });
  };

  const isFormValid =
    name.trim().length >= 1 &&
    systemPrompt.trim().length >= 10 &&
    userPromptTemplate.trim().length >= 10 &&
    Object.values(lengthConfigs).some((c) => c.enabled);

  const handleSubmit = async () => {
    setFormError(null);

    // Build node_count_config from enabled lengths
    const nodeCountConfig: Record<
      string,
      { max_nodes: number; max_words: number; description: string }
    > = {};
    for (const [length, config] of Object.entries(lengthConfigs)) {
      if (config.enabled) {
        nodeCountConfig[length] = {
          max_nodes: config.maxNodes,
          max_words: config.maxWords,
          description: config.description,
        };
      }
    }

    // Ensure default_length references an enabled length
    const effectiveDefault: string = nodeCountConfig[defaultLength]
      ? defaultLength
      : (Object.keys(nodeCountConfig)[0] ?? "medium");

    const request: CreateHTNTemplateRequest = {
      name: name.trim(),
      template_type: templateType,
      description: description.trim() || undefined,
      system_prompt: systemPrompt.trim(),
      user_prompt_template: userPromptTemplate.trim(),
      node_count_config: nodeCountConfig,
      default_length: effectiveDefault,
    };

    try {
      const result = await createMutation.mutateAsync(request);
      onCreated?.(result.id);
      handleClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create template";
      setFormError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Custom HTN Template"
      size="xl"
    >
      <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {formError && (
          <div className="alert alert-error text-sm">
            <span>{formError}</span>
          </div>
        )}

        {/* Name & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Template Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="My Custom Blog Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Type *</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
            >
              <option value="blog">Blog</option>
              <option value="card">Card</option>
              <option value="curriculum">Curriculum</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Description (optional)
            </span>
            <span className="label-text-alt">{description.length}/1000</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-16"
            placeholder="What this template is designed for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </div>

        {/* System Prompt */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">System Prompt *</span>
            <span className="label-text-alt">min 10 chars</span>
          </label>
          <textarea
            className={`textarea textarea-bordered h-32 font-mono text-xs ${
              systemPrompt.length > 0 && systemPrompt.length < 10
                ? "textarea-error"
                : ""
            }`}
            placeholder="You are an expert content strategist..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        {/* User Prompt Template */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              User Prompt Template *
            </span>
            <span className="label-text-alt">min 10 chars</span>
          </label>
          <textarea
            className={`textarea textarea-bordered h-32 font-mono text-xs ${
              userPromptTemplate.length > 0 && userPromptTemplate.length < 10
                ? "textarea-error"
                : ""
            }`}
            placeholder="Based on the following context, design a blog outline..."
            value={userPromptTemplate}
            onChange={(e) => setUserPromptTemplate(e.target.value)}
          />
          <label className="label">
            <span className="label-text-alt">
              Available placeholders:{" "}
              {PLACEHOLDER_HINTS.map((p) => (
                <code key={p} className="text-xs mx-0.5 opacity-80">
                  {p}
                </code>
              ))}
            </span>
          </label>
        </div>

        {/* Length Configurations */}
        <div className="divider text-sm">Length Configurations</div>

        {Object.entries(lengthConfigs).map(([length, config]) => (
          <div
            key={length}
            className={`card bg-base-200 ${config.enabled ? "" : "opacity-50"}`}
          >
            <div className="card-body p-4 space-y-2">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={config.enabled}
                  onChange={(e) =>
                    updateLengthConfig(length, "enabled", e.target.checked)
                  }
                />
                <span className="label-text font-semibold capitalize">
                  {length}
                </span>
              </label>

              {config.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-xs">Max Nodes</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input input-bordered input-sm"
                      placeholder="4"
                      value={config.maxNodes}
                      onChange={(e) =>
                        updateLengthConfig(length, "maxNodes", Number(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-xs">Max Words / Section</span>
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      step={50}
                      className="input input-bordered input-sm"
                      placeholder="1200"
                      value={config.maxWords}
                      onChange={(e) =>
                        updateLengthConfig(length, "maxWords", Number(e.target.value) || 100)
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-xs">Description</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      placeholder="Concise content..."
                      value={config.description}
                      onChange={(e) =>
                        updateLengthConfig(
                          length,
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Default Length */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Default Length</span>
          </label>
          <select
            className="select select-bordered select-sm w-full max-w-xs"
            value={defaultLength}
            onChange={(e) => setDefaultLength(e.target.value)}
          >
            {Object.entries(lengthConfigs)
              .filter(([, c]) => c.enabled)
              .map(([length]) => (
                <option key={length} value={length}>
                  {length.charAt(0).toUpperCase() + length.slice(1)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-base-300">
        <button className="btn btn-sm" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSubmit}
          disabled={!isFormValid || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              Creating...
            </>
          ) : (
            "Create Template"
          )}
        </button>
      </div>
    </Modal>
  );
}
