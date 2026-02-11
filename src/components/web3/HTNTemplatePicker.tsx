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
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  blog: "badge-primary",
  card: "badge-secondary",
  curriculum: "badge-accent",
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select HTN Template"
      description="Choose a template for blog/card generation, or create your own."
      size="xl"
    >
      <div className="mt-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          <button
            className={`btn btn-sm ${typeFilter === null ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTypeFilter(null)}
          >
            All
          </button>
          {["blog", "card", "curriculum"].map((type) => (
            <button
              key={type}
              className={`btn btn-sm ${typeFilter === type ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTypeFilter(type)}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg" />
            <p className="mt-4 text-sm opacity-70">Loading templates...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="alert alert-error">
            <span>Failed to load templates. Please try again.</span>
          </div>
        )}

        {/* Template cards */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
            {/* Default / None option */}
            <div
              className={`card bg-base-200 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                !selectedTemplateId ? "ring-2 ring-primary" : ""
              }`}
              onClick={handleClearSelection}
            >
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    className="radio radio-primary radio-sm mt-1"
                    checked={!selectedTemplateId}
                    readOnly
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Default (Auto)</p>
                    <p className="text-xs opacity-70">
                      Use the system default template based on content type.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {templates.map((template) => (
              <div
                key={template.id}
                className={`card bg-base-200 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplateId === template.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => handleSelect(template)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      className="radio radio-primary radio-sm mt-1"
                      checked={selectedTemplateId === template.id}
                      readOnly
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{template.name}</p>
                        <span
                          className={`badge badge-sm ${TYPE_BADGE_CLASSES[template.template_type] ?? "badge-ghost"}`}
                        >
                          {TYPE_LABELS[template.template_type] ??
                            template.template_type}
                        </span>
                      </div>
                      {template.description && (
                        <p className="text-xs opacity-70 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(template.node_count_config).map(
                          ([length, config]) => (
                            <span
                              key={length}
                              className="badge badge-outline badge-xs"
                            >
                              {length}: {config.max_nodes} sections,{" "}
                              {config.max_words} words/section
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {templates.length === 0 && !isLoading && (
              <div className="text-center py-6 opacity-60">
                <p className="text-sm">No templates found for this filter.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-base-300">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              onCreateCustom();
              onClose();
            }}
          >
            + Create Custom Template
          </button>
          <button className="btn btn-sm" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
