"use client";

/**
 * HTNTemplatePicker Component
 *
 * Modal for selecting an HTN template from the available templates.
 * Supports filtering by type and opening the template creator.
 */
import { useState } from "react";

import type { HTNTemplateInfo } from "@/types";

import { useHTNTemplatesQuery } from "@/hooks/queries";

import { Modal } from "@/components/ui/modal";

interface HTNTemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: HTNTemplateInfo | null) => void;
  onCreateCustom: () => void;
  selectedTemplateId?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  blog: "Blog",
  card: "Card",
  curriculum: "Curriculum",
  evaluation: "Evaluation",
};

export function HTNTemplatePicker({
  isOpen,
  onClose,
  onSelect,
  onCreateCustom,
  selectedTemplateId,
}: HTNTemplatePickerProps) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data, isLoading, error } = useHTNTemplatesQuery({
    templateType: typeFilter,
    enabled: isOpen,
  });

  const templates = data?.templates ?? [];

  const handleSelect = (template: HTNTemplateInfo) => {
    onSelect(template);
    onClose();
  };

  const handleClearSelection = () => {
    onSelect(null);
    onClose();
  };

  const filterTypes = ["blog", "card", "evaluation", "curriculum"];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Template"
      description="Choose a template for blog generation, or create your own."
      size="xl"
    >
      <div className="mt-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: typeFilter === null ? "rgba(245, 87, 42, 0.15)" : "transparent",
              border: `1px solid ${typeFilter === null ? "rgba(245, 87, 42, 0.3)" : "rgba(255, 255, 255, 0.07)"}`,
              color: typeFilter === null ? "#f5572a" : "#8da8af",
            }}
            onClick={() => setTypeFilter(null)}
          >
            All
          </button>
          {filterTypes.map((type) => (
            <button
              key={type}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: typeFilter === type ? "rgba(245, 87, 42, 0.15)" : "transparent",
                border: `1px solid ${typeFilter === type ? "rgba(245, 87, 42, 0.3)" : "rgba(255, 255, 255, 0.07)"}`,
                color: typeFilter === type ? "#f5572a" : "#8da8af",
              }}
              onClick={() => setTypeFilter(type)}
            >
              {TYPE_LABELS[type] ?? type}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(255,255,255,0.07)", borderTopColor: "#f5572a" }}
            />
            <p className="mt-3 text-xs" style={{ color: "#3d5a64" }}>
              Loading templates...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="flex items-center gap-3 p-3 rounded-lg text-sm"
            style={{
              background: "rgba(220, 50, 50, 0.08)",
              border: "1px solid rgba(220, 50, 50, 0.2)",
              color: "#ff6b6b",
            }}
          >
            <span>!</span>
            <span>Failed to load templates. Please try again.</span>
          </div>
        )}

        {/* Template cards */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto scrollbar-hide rounded-lg">
            {/* Default / None option */}
            <button
              type="button"
              className="relative text-left p-4 transition-colors duration-200 cursor-pointer rounded-lg"
              style={{
                background: !selectedTemplateId ? "#1a2f3a" : "#152530",
                outline: !selectedTemplateId ? "2px solid #f5572a" : "none",
                outlineOffset: "-2px",
              }}
              onClick={handleClearSelection}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all"
                  style={{
                    borderColor: !selectedTemplateId ? "#f5572a" : "rgba(255,255,255,0.14)",
                    background: !selectedTemplateId ? "#f5572a" : "transparent",
                  }}
                >
                  {!selectedTemplateId && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#f3ffff" }}>
                    Default (Auto)
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8da8af" }}>
                    Use the system default template based on content type.
                  </p>
                </div>
              </div>
            </button>

            {templates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  className="relative text-left p-4 transition-colors duration-200 cursor-pointer rounded-lg"
                  style={{
                    background: isSelected ? "#1a2f3a" : "#152530",
                    outline: isSelected ? "2px solid #f5572a" : "none",
                    outlineOffset: "-2px",
                  }}
                  onClick={() => handleSelect(template)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#1a2f3a";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#152530";
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all"
                      style={{
                        borderColor: isSelected ? "#f5572a" : "rgba(255,255,255,0.14)",
                        background: isSelected ? "#f5572a" : "transparent",
                      }}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold" style={{ color: "#f3ffff" }}>
                          {template.name}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                          style={{
                            background: "rgba(245, 87, 42, 0.15)",
                            color: "#f5572a",
                            fontSize: "10px",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          {TYPE_LABELS[template.template_type] ?? template.template_type}
                        </span>
                      </div>
                      {template.description && (
                        <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "#8da8af" }}>
                          {template.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(template.node_count_config).map(
                          ([length, config]) => (
                            <span
                              key={length}
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{
                                border: "1px solid rgba(255, 255, 255, 0.07)",
                                color: "#3d5a64",
                                fontSize: "10px",
                              }}
                            >
                              {length}: {config.max_nodes} sections, {config.max_words} words
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {templates.length === 0 && !isLoading && (
              <div className="text-center py-6" style={{ color: "#3d5a64" }}>
                <p className="text-sm">No templates found for this filter.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.07)" }}
        >
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "#8da8af",
              background: "transparent",
            }}
            onClick={() => {
              onCreateCustom();
              onClose();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#152530";
              e.currentTarget.style.color = "#f3ffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#8da8af";
            }}
          >
            + Create Custom
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "#8da8af",
              background: "transparent",
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#152530";
              e.currentTarget.style.color = "#f3ffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#8da8af";
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
