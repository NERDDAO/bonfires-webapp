"use client";

/**
 * DataRoomWizard Component
 *
 * Multi-step wizard for creating new data rooms.
 * Steps: 1) Select Bonfire, 2) Description & Settings, 3) Center Node Selection
 */
import { useCallback, useEffect, useState } from "react";

import type { BonfireInfo, HTNTemplateInfo } from "@/types";

import { useAgentSelection } from "@/hooks/web3";

import { HTNTemplateCreator } from "./HTNTemplateCreator";
import { HTNTemplatePicker } from "./HTNTemplatePicker";

interface DataRoomConfig {
  bonfireId: string;
  bonfire: BonfireInfo;
  description: string;
  systemPrompt?: string;
  centerNodeUuid: string;
  centerNodeName: string;
  priceUsd: number;
  queryLimit: number;
  expirationDays: number;
  dynamicPricingEnabled?: boolean;
  priceStepUsd?: number;
  priceDecayRate?: number;
  imageModel?: "schnell" | "dev" | "pro" | "realism";
  htnTemplateId?: string;
}

interface PreviewEntity {
  uuid: string;
  name: string;
  summary?: string;
  entity_type?: string;
}

interface DataRoomWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: DataRoomConfig) => void;
  initialBonfireId?: string;
  initialCenterNodeUuid?: string;
}

export function DataRoomWizard({
  isOpen,
  onClose,
  onComplete,
  initialBonfireId,
  initialCenterNodeUuid,
}: DataRoomWizardProps) {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBonfire, setSelectedBonfire] = useState<BonfireInfo | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [priceUsd, setPriceUsd] = useState<number>(0.01);
  const [queryLimit, setQueryLimit] = useState<number>(20);
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [previewEntities, setPreviewEntities] = useState<PreviewEntity[]>([]);
  const [selectedCenterNode, setSelectedCenterNode] =
    useState<PreviewEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicPricingEnabled, setDynamicPricingEnabled] =
    useState<boolean>(false);
  const [priceStepUsd, setPriceStepUsd] = useState<number>(0.0);
  const [priceDecayRate, setPriceDecayRate] = useState<number>(0.0);
  const [imageModel, setImageModel] = useState<
    "schnell" | "dev" | "pro" | "realism"
  >("dev");
  const [selectedTemplate, setSelectedTemplate] =
    useState<HTNTemplateInfo | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const agentSelection = useAgentSelection({ initialBonfireId });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedBonfire(null);
      setDescription("");
      setSystemPrompt("");
      setPriceUsd(0.01);
      setQueryLimit(20);
      setExpirationDays(30);
      setPreviewEntities([]);
      setSelectedCenterNode(null);
      setError(null);
      setDynamicPricingEnabled(false);
      setPriceStepUsd(0.0);
      setPriceDecayRate(0.0);
      setImageModel("dev");
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  // Pre-select bonfire if provided
  useEffect(() => {
    if (
      initialBonfireId &&
      agentSelection.availableBonfires.length > 0 &&
      !selectedBonfire
    ) {
      const bonfire = agentSelection.availableBonfires.find(
        (b) => b.id === initialBonfireId
      );
      if (bonfire) {
        setSelectedBonfire(bonfire);
      }
    }
  }, [initialBonfireId, agentSelection.availableBonfires, selectedBonfire]);

  // Fetch preview when entering step 3
  useEffect(() => {
    if (currentStep === 3 && selectedBonfire && description.trim()) {
      fetchPreview();
    }
  }, [currentStep, selectedBonfire, description]);

  const fetchPreview = useCallback(async () => {
    if (!selectedBonfire || !description.trim()) return;

    setLoading(true);
    setError(null);
    setPreviewEntities([]);
    setSelectedCenterNode(null);

    try {
      const response = await fetch(`/api/graph/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bonfire_id: selectedBonfire.id,
          query: description,
          num_results: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const entityCandidates = data.entities ?? data.nodes ?? [];

      const entities: PreviewEntity[] =
        entityCandidates
          ?.filter(
            (entity: { uuid?: string; id?: string }) => entity.uuid || entity.id
          )
          .map(
            (entity: {
              uuid?: string;
              id?: string;
              name?: string;
              summary?: string;
              description?: string;
              entity_type?: string;
              type?: string;
            }) => ({
              uuid: entity.uuid || entity.id,
              name: entity.name || "Unnamed Entity",
              summary: entity.summary || entity.description || "",
              entity_type: entity.entity_type || entity.type || "Unknown",
            })
          ) || [];

      setPreviewEntities(entities);

      // Pre-select if initialCenterNodeUuid provided
      if (initialCenterNodeUuid) {
        const initial = entities.find(
          (e: PreviewEntity) => e.uuid === initialCenterNodeUuid
        );
        if (initial) {
          setSelectedCenterNode(initial);
        }
      }

      if (entities.length === 0) {
        setError(
          "No entities found for this description. Try a different search query."
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch preview";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedBonfire, description, initialCenterNodeUuid]);

  // Validation helpers
  const isStep2Valid =
    description.trim().length >= 10 &&
    description.length <= 500 &&
    priceUsd > 0 &&
    queryLimit >= 1 &&
    queryLimit <= 1000 &&
    expirationDays >= 1 &&
    expirationDays <= 365;
  const isSystemPromptValid = systemPrompt.length <= 1000;

  const handleNext = useCallback(() => {
    setError(null);
    if (currentStep === 1 && selectedBonfire) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3);
    }
  }, [currentStep, selectedBonfire, isStep2Valid]);

  const handleBack = useCallback(() => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    if (!selectedBonfire || !selectedCenterNode || !description.trim()) return;

    const config: DataRoomConfig = {
      bonfireId: selectedBonfire.id,
      bonfire: selectedBonfire,
      description: description.trim(),
      systemPrompt: systemPrompt.trim() || undefined,
      centerNodeUuid: selectedCenterNode.uuid,
      centerNodeName: selectedCenterNode.name,
      priceUsd,
      queryLimit,
      expirationDays,
      dynamicPricingEnabled,
      priceStepUsd,
      priceDecayRate,
      imageModel,
      htnTemplateId: selectedTemplate?.id,
    };

    onComplete(config);
    onClose();
  }, [
    selectedBonfire,
    selectedCenterNode,
    description,
    systemPrompt,
    priceUsd,
    queryLimit,
    expirationDays,
    dynamicPricingEnabled,
    priceStepUsd,
    priceDecayRate,
    imageModel,
    selectedTemplate,
    onComplete,
    onClose,
  ]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        if (currentStep === 1 && selectedBonfire) {
          handleNext();
        } else if (currentStep === 2 && isStep2Valid) {
          handleNext();
        } else if (currentStep === 3 && selectedCenterNode) {
          handleComplete();
        }
      }
    },
    [
      currentStep,
      selectedBonfire,
      isStep2Valid,
      selectedCenterNode,
      onClose,
      handleNext,
      handleComplete,
    ]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="modal modal-open" onClick={onClose}>
      <div
        className="modal-box relative max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="font-bold text-2xl mb-6">Create Data Room</h3>

        <ul className="steps w-full mb-6">
          <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
            Select Bonfire
          </li>
          <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
            Description
          </li>
          <li className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>
            Center Node
          </li>
        </ul>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Bonfire Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Select a Bonfire
                </span>
              </label>
              {agentSelection.loading.bonfires ? (
                <div className="skeleton h-12 w-full"></div>
              ) : agentSelection.error.bonfires ? (
                <div className="alert alert-error">
                  <span>{agentSelection.error.bonfires}</span>
                </div>
              ) : (
                <select
                  className="select select-bordered w-full"
                  value={selectedBonfire?.id || ""}
                  onChange={(e) => {
                    const bonfire = agentSelection.availableBonfires.find(
                      (b) => b.id === e.target.value
                    );
                    setSelectedBonfire(bonfire || null);
                  }}
                >
                  <option value="">— Select Bonfire —</option>
                  {agentSelection.availableBonfires.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="modal-action">
              <button className="btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!selectedBonfire}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Description & Settings */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description *</span>
                <span className="label-text-alt">
                  {description.length}/500 (min 10 chars)
                </span>
              </label>
              <textarea
                className={`textarea textarea-bordered h-24 ${
                  description.length > 0 && !isStep2Valid
                    ? "textarea-error"
                    : ""
                }`}
                placeholder="Describe the data room purpose and scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  System Prompt (optional)
                </span>
                <span className="label-text-alt">
                  {systemPrompt.length}/1000
                </span>
              </label>
              <textarea
                className={`textarea textarea-bordered h-32 ${!isSystemPromptValid ? "textarea-error" : ""}`}
                placeholder="Enter a custom system prompt for chat interactions..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                maxLength={1000}
              />
            </div>

            <div className="divider">Subscription Settings</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Price (USD) *
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="5.00"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(parseFloat(e.target.value) || 0)}
                  min={0.01}
                  max={1000}
                  step={0.01}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Query Limit *
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="20"
                  value={queryLimit}
                  onChange={(e) => setQueryLimit(parseInt(e.target.value) || 0)}
                  min={1}
                  max={1000}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Expiration (Days) *
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="30"
                  value={expirationDays}
                  onChange={(e) =>
                    setExpirationDays(parseInt(e.target.value) || 0)
                  }
                  min={1}
                  max={365}
                />
              </div>
            </div>

            <div className="divider">Dynamic Pricing (Optional)</div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={dynamicPricingEnabled}
                  onChange={(e) => setDynamicPricingEnabled(e.target.checked)}
                />
                <span className="label-text">
                  Enable dynamic pricing for hyperblogs
                </span>
              </label>
            </div>

            {dynamicPricingEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Price Step (USD)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={priceStepUsd}
                    onChange={(e) =>
                      setPriceStepUsd(parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Decay Rate (USD/hour)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={priceDecayRate}
                    onChange={(e) =>
                      setPriceDecayRate(parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    max={10}
                    step={0.01}
                  />
                </div>
              </div>
            )}

            <div className="divider">Image Generation</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Banner Image Model
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={imageModel}
                onChange={(e) =>
                  setImageModel(
                    e.target.value as "schnell" | "dev" | "pro" | "realism"
                  )
                }
              >
                <option value="schnell">Schnell - Fast & Good Quality</option>
                <option value="dev">Dev - Balanced Speed/Quality</option>
                <option value="pro">Pro - High Quality</option>
                <option value="realism">Realism - Photorealistic</option>
              </select>
            </div>

            <div className="divider">HTN Template (Optional)</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Blog/Card Generation Template
                </span>
              </label>
              <div className="flex items-center gap-2">
                {selectedTemplate ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="badge badge-primary badge-sm">
                      {selectedTemplate.template_type}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {selectedTemplate.name}
                    </span>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <span className="text-sm opacity-60 flex-1">
                    Default (Auto)
                  </span>
                )}
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setIsPickerOpen(true)}
                >
                  {selectedTemplate ? "Change" : "Select Template"}
                </button>
              </div>
              <label className="label">
                <span className="label-text-alt opacity-60">
                  Controls how blog/card content is structured and generated.
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={handleBack}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!isStep2Valid || !isSystemPromptValid}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* HTN Template Picker Modal */}
        <HTNTemplatePicker
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={setSelectedTemplate}
          onCreateCustom={() => setIsCreatorOpen(true)}
          selectedTemplateId={selectedTemplate?.id}
        />

        {/* HTN Template Creator Modal */}
        <HTNTemplateCreator
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onCreated={() => {
            // Re-open picker after creating so user can select the new template
            setIsCreatorOpen(false);
            setIsPickerOpen(true);
          }}
        />

        {/* Step 3: Center Node Selection */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-4 text-sm opacity-70">Fetching entities...</p>
              </div>
            ) : previewEntities.length === 0 ? (
              <div className="alert alert-warning">
                <span>
                  No entities found. Try going back and adjusting your
                  description.
                </span>
              </div>
            ) : (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Select Center Node
                    </span>
                    <span className="label-text-alt">
                      {previewEntities.length} entities found
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {previewEntities.map((entity) => (
                    <div
                      key={entity.uuid}
                      className={`card bg-base-200 shadow-sm cursor-pointer transition-all ${
                        selectedCenterNode?.uuid === entity.uuid
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedCenterNode(entity)}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            className="radio radio-primary radio-sm mt-1"
                            checked={selectedCenterNode?.uuid === entity.uuid}
                            onChange={() => setSelectedCenterNode(entity)}
                          />
                          <div className="flex-1">
                            <span className="badge badge-primary badge-sm mb-1">
                              {entity.entity_type}
                            </span>
                            <p className="font-semibold text-sm">
                              {entity.name}
                            </p>
                            {entity.summary && (
                              <p className="text-xs opacity-70 line-clamp-2">
                                {entity.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="modal-action">
              <button className="btn" onClick={handleBack}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleComplete}
                disabled={!selectedCenterNode || loading}
              >
                Create Data Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
