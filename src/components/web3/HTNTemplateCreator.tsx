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
      size="xl"
      showCloseButton
      className="max-w-[720px] max-h-[85vh] overflow-y-auto"
    >
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--bf-border)", paddingBottom: 16, marginBottom: 20 }}>
        <div className="bf-section-label">HTN TEMPLATE</div>
        <h2
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "var(--bf-text)",
            lineHeight: 1.1,
          }}
        >
          Create Custom Template
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {formError && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--bf-radius)",
              padding: "10px 14px",
              fontSize: 13,
              color: "#ef4444",
            }}
          >
            {formError}
          </div>
        )}

        {/* Name & Type */}
        <div className="bf-grid-2">
          <div>
            <span className="bf-label">Template Name *</span>
            <input
              type="text"
              className="bf-input"
              placeholder="My Custom Blog Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <span className="bf-label">Type *</span>
            <select
              className="bf-input"
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              style={{ padding: "10px 14px" }}
            >
              <option value="blog">Blog</option>
              <option value="card">Card</option>
              <option value="curriculum">Curriculum</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="bf-label">Description (optional)</span>
            <span style={{ fontSize: 11, color: "var(--bf-text-dim)" }}>
              {description.length}/1000
            </span>
          </div>
          <textarea
            className="bf-textarea"
            style={{ minHeight: 64 }}
            placeholder="What this template is designed for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </div>

        {/* System Prompt */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="bf-label">System Prompt *</span>
            <span style={{ fontSize: 11, color: "var(--bf-text-dim)" }}>min 10 chars</span>
          </div>
          <textarea
            className="bf-textarea"
            style={{
              minHeight: 120,
              fontFamily: "monospace",
              fontSize: 12,
              borderColor: systemPrompt.length > 0 && systemPrompt.length < 10
                ? "var(--bf-ember)"
                : undefined,
            }}
            placeholder="You are an expert content strategist..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        {/* User Prompt Template */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="bf-label">User Prompt Template *</span>
            <span style={{ fontSize: 11, color: "var(--bf-text-dim)" }}>min 10 chars</span>
          </div>
          <textarea
            className="bf-textarea"
            style={{
              minHeight: 120,
              fontFamily: "monospace",
              fontSize: 12,
              borderColor: userPromptTemplate.length > 0 && userPromptTemplate.length < 10
                ? "var(--bf-ember)"
                : undefined,
            }}
            placeholder="Based on the following context, design a blog outline..."
            value={userPromptTemplate}
            onChange={(e) => setUserPromptTemplate(e.target.value)}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: "var(--bf-text-dim)" }}>
            Placeholders:{" "}
            {PLACEHOLDER_HINTS.map((p) => (
              <code
                key={p}
                style={{
                  fontSize: 11,
                  margin: "0 2px",
                  padding: "1px 4px",
                  borderRadius: 4,
                  background: "var(--bf-surface2)",
                  color: "var(--bf-text-secondary)",
                }}
              >
                {p}
              </code>
            ))}
          </div>
        </div>

        {/* Length Configurations */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div className="bf-ember-line" />
            <span className="bf-section-label" style={{ marginBottom: 0 }}>
              Length Configurations
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(lengthConfigs).map(([length, config]) => (
              <div
                key={length}
                style={{
                  background: "var(--bf-surface2)",
                  border: "1px solid var(--bf-border)",
                  borderRadius: "var(--bf-radius)",
                  padding: 16,
                  opacity: config.enabled ? 1 : 0.5,
                  transition: "opacity 0.2s",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    marginBottom: config.enabled ? 12 : 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) =>
                      updateLengthConfig(length, "enabled", e.target.checked)
                    }
                    style={{ accentColor: "var(--bf-ember)" }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--bf-text)",
                      textTransform: "capitalize",
                    }}
                  >
                    {length}
                  </span>
                </label>

                {config.enabled && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 2fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <span className="bf-label" style={{ fontSize: 11 }}>Max Nodes</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className="bf-input"
                        style={{ padding: "6px 10px", fontSize: 13 }}
                        value={config.maxNodes}
                        onChange={(e) =>
                          updateLengthConfig(length, "maxNodes", Number(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div>
                      <span className="bf-label" style={{ fontSize: 11 }}>Max Words</span>
                      <input
                        type="number"
                        min={50}
                        max={2000}
                        step={50}
                        className="bf-input"
                        style={{ padding: "6px 10px", fontSize: 13 }}
                        value={config.maxWords}
                        onChange={(e) =>
                          updateLengthConfig(length, "maxWords", Number(e.target.value) || 100)
                        }
                      />
                    </div>
                    <div>
                      <span className="bf-label" style={{ fontSize: 11 }}>Description</span>
                      <input
                        type="text"
                        className="bf-input"
                        style={{ padding: "6px 10px", fontSize: 13 }}
                        placeholder="Concise content..."
                        value={config.description}
                        onChange={(e) =>
                          updateLengthConfig(length, "description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Default Length */}
        <div>
          <span className="bf-label">Default Length</span>
          <select
            className="bf-input"
            style={{ padding: "8px 12px", maxWidth: 200 }}
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
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          paddingTop: 16,
          marginTop: 20,
          borderTop: "1px solid var(--bf-border)",
        }}
      >
        <button className="bf-btn-secondary" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="bf-btn-primary"
          onClick={() => void handleSubmit()}
          disabled={!isFormValid || createMutation.isPending}
        >
          {createMutation.isPending ? "Creating..." : "Create Template"}
        </button>
      </div>
    </Modal>
  );
}
