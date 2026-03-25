"use client";

/**
 * DataRoomWizard Component
 *
 * Multi-step wizard for creating new data rooms.
 * Steps: 1) Select Bonfire, 2) Description & Settings, 3) Center Node Selection
 *
 * Styled with the Bonfires design system: deep teal-black surfaces,
 * ember accent, Montserrat headings, DM Sans body.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import type { BonfireInfo, HTNTemplateInfo } from "@/types";

import { apiClient } from "@/lib/api/client";

import { useSubdomainBonfire } from "@/contexts";
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
  publicOnly?: boolean;
  defaultPriceUsd?: number;
}

/* ── Design System Tokens (inline, scoped to wizard) ── */
const ds = {
  bg: "#0d1f26",
  bg2: "#111c23",
  surface: "#152530",
  surface2: "#1a2f3a",
  ember: "#f5572a",
  emberDim: "rgba(245, 87, 42, 0.15)",
  text: "#f3ffff",
  textSecondary: "#8da8af",
  textDim: "#3d5a64",
  border: "rgba(255, 255, 255, 0.07)",
  borderBright: "rgba(255, 255, 255, 0.14)",
  radius: "8px",
} as const;

const STEPS = ["Bonfire", "Configure", "Center Node"] as const;

export function DataRoomWizard({
  isOpen,
  onClose,
  onComplete,
  initialBonfireId,
  initialCenterNodeUuid,
  publicOnly,
  defaultPriceUsd,
}: DataRoomWizardProps) {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBonfire, setSelectedBonfire] = useState<BonfireInfo | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [priceUsd, setPriceUsd] = useState<number>(defaultPriceUsd ?? 1);
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
  const [templateFormat, setTemplateFormat] = useState<"blog" | "card">("blog");
  const [selectedTemplate, setSelectedTemplate] = useState<HTNTemplateInfo | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);
  const [clusterMemberIds, setClusterMemberIds] = useState<Set<string> | null>(null);

  const agentSelection = useAgentSelection({ initialBonfireId });
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedBonfire(null);
      setDescription("");
      setSystemPrompt("");
      setPriceUsd(defaultPriceUsd ?? 1);
      setQueryLimit(20);
      setExpirationDays(30);
      setPreviewEntities([]);
      setSelectedCenterNode(null);
      setError(null);
      setDynamicPricingEnabled(false);
      setPriceStepUsd(0.0);
      setPriceDecayRate(0.0);
      setImageModel("dev");
      setTemplateFormat("blog");
      setSelectedTemplate(null);
      setStep2Attempted(false);
      setClusterMemberIds(null);
    }
  }, [isOpen, defaultPriceUsd]);

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

  // Auto-select subdomain bonfire — check cluster ownership first
  useEffect(() => {
    if (!isSubdomainScoped || !subdomainConfig?.bonfireId) return;
    if (agentSelection.availableBonfires.length === 0) return;
    if (selectedBonfire) return;

    const bonfireId = subdomainConfig.bonfireId;

    // Check if this bonfire owns a cluster
    apiClient
      .get<{ clusters: Array<{ bonfire_ids: string[]; owner_bonfire_id: string }> }>(
        `/api/clusters?owner_bonfire_id=${bonfireId}`
      )
      .then((data) => {
        const cluster = data.clusters?.[0];
        if (cluster && cluster.bonfire_ids.length > 0) {
          // Cluster leader: collect all member IDs + owner, show step 1
          const memberSet = new Set(cluster.bonfire_ids.map(String));
          memberSet.add(bonfireId);
          setClusterMemberIds(memberSet);
          // Stay on step 1 so user can pick a bonfire
        } else {
          // Not a cluster leader: auto-select and skip to step 2
          const bonfire = agentSelection.availableBonfires.find(
            (b) => b.id === bonfireId
          );
          if (bonfire) {
            setSelectedBonfire(bonfire);
            setCurrentStep(2);
          }
        }
      })
      .catch(() => {
        // Cluster lookup failed — fall back to auto-select
        const bonfire = agentSelection.availableBonfires.find(
          (b) => b.id === bonfireId
        );
        if (bonfire) {
          setSelectedBonfire(bonfire);
          setCurrentStep(2);
        }
      });
  }, [isSubdomainScoped, subdomainConfig?.bonfireId, agentSelection.availableBonfires, selectedBonfire]);

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
    description.length <= 500;
  const isSystemPromptValid = systemPrompt.length <= 1000;

  const handleNext = useCallback(() => {
    setError(null);
    if (currentStep === 1 && selectedBonfire) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setStep2Attempted(true);
      if (isStep2Valid) {
        setCurrentStep(3);
      }
    }
  }, [currentStep, selectedBonfire, isStep2Valid]);

  const handleBack = useCallback(() => {
    setError(null);
    const minStep = isSubdomainScoped ? 2 : 1;
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, isSubdomainScoped]);

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

  const displayBonfires = useMemo(() => {
    let bonfires = agentSelection.availableBonfires;
    if (publicOnly) {
      bonfires = bonfires.filter((b) => b.is_public !== false);
    }
    if (clusterMemberIds) {
      bonfires = bonfires.filter((b) => clusterMemberIds.has(b.id));
    }
    return bonfires;
  }, [agentSelection.availableBonfires, publicOnly, clusterMemberIds]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        style={{ background: "rgba(6, 14, 18, 0.85)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        {/* ── Modal Panel ── */}
        <div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          style={{
            background: ds.bg,
            border: `1px solid ${ds.border}`,
            borderRadius: ds.radius,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div
            className="sticky top-0 z-10 px-8 pt-8 pb-6"
            style={{
              background: ds.bg,
              borderBottom: `1px solid ${ds.border}`,
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p
                  className="uppercase tracking-widest mb-2"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: ds.ember,
                  }}
                >
                  New Data Room
                </p>
                <h3
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "clamp(20px, 3vw, 28px)",
                    fontWeight: 800,
                    color: ds.text,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {currentStep === 1 && "Choose your Bonfire"}
                  {currentStep === 2 && "Configure your room"}
                  {currentStep === 3 && "Pick a center node"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded transition-colors cursor-pointer"
                style={{
                  color: ds.textSecondary,
                  border: `1px solid ${ds.border}`,
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = ds.surface;
                  e.currentTarget.style.borderColor = ds.borderBright;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = ds.border;
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ── Step Indicator ── */}
            <div className="flex items-center gap-0">
              {STEPS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = currentStep === stepNum;
                const isDone = currentStep > stepNum;
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300"
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          background: isActive ? ds.ember : isDone ? ds.emberDim : ds.surface,
                          color: isActive ? "#fff" : isDone ? ds.ember : ds.textDim,
                          border: `1px solid ${isActive ? ds.ember : isDone ? "rgba(245,87,42,0.3)" : ds.border}`,
                          fontSize: "11px",
                        }}
                      >
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          stepNum
                        )}
                      </div>
                      <span
                        className="hidden sm:block whitespace-nowrap"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "13px",
                          fontWeight: isActive ? 500 : 400,
                          color: isActive ? ds.text : isDone ? ds.textSecondary : ds.textDim,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 mx-3 h-px"
                        style={{
                          background: isDone
                            ? `linear-gradient(90deg, ${ds.ember}, rgba(245,87,42,0.3))`
                            : ds.border,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-8 py-6 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {error && (
              <div
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: "rgba(220, 50, 50, 0.08)",
                  border: "1px solid rgba(220, 50, 50, 0.2)",
                  color: "#ff6b6b",
                  fontSize: "14px",
                }}
              >
                <span className="shrink-0 mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* ══════════ Step 1: Bonfire Selection ══════════ */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {agentSelection.loading.bonfires ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 rounded-lg overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse"
                        style={{ background: ds.surface }}
                      />
                    ))}
                  </div>
                ) : agentSelection.error.bonfires ? (
                  <div
                    className="p-4 rounded-lg text-sm"
                    style={{
                      background: "rgba(220, 50, 50, 0.08)",
                      border: "1px solid rgba(220, 50, 50, 0.2)",
                      color: "#ff6b6b",
                    }}
                  >
                    {agentSelection.error.bonfires}
                  </div>
                ) : displayBonfires.length === 0 ? (
                  <div
                    className="p-6 rounded-lg text-center"
                    style={{
                      background: ds.surface,
                      color: ds.textSecondary,
                      fontSize: "14px",
                    }}
                  >
                    No public bonfires available to create a dataroom.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 rounded-lg overflow-hidden">
                    {displayBonfires.map((b) => {
                      const isSelected = selectedBonfire?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          className="relative text-left p-5 transition-colors duration-200 cursor-pointer"
                          style={{
                            background: isSelected ? ds.surface2 : ds.surface,
                            outline: isSelected ? `2px solid ${ds.ember}` : "none",
                            outlineOffset: "-2px",
                            borderRadius: isSelected ? ds.radius : undefined,
                            zIndex: isSelected ? 1 : 0,
                          }}
                          onClick={() => setSelectedBonfire(b)}
                          onMouseEnter={(e) => {
                            if (!isSelected)
                              e.currentTarget.style.background = ds.surface2;
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected)
                              e.currentTarget.style.background = ds.surface;
                          }}
                        >
                          {isSelected && (
                            <div
                              className="absolute top-0 left-0 right-0 h-0.5"
                              style={{ background: ds.ember }}
                            />
                          )}
                          <p
                            style={{
                              fontFamily: "'Montserrat', sans-serif",
                              fontSize: "15px",
                              fontWeight: 700,
                              color: isSelected ? ds.text : ds.textSecondary,
                              marginBottom: "4px",
                            }}
                          >
                            {b.name}
                          </p>
                          {b.is_public && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase" as const,
                                color: ds.ember,
                              }}
                            >
                              Public
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ Step 2: Description & Settings ══════════ */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Bonfire indicator when auto-selected */}
                {selectedBonfire && isSubdomainScoped && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: ds.emberDim,
                      border: `1px solid rgba(245, 87, 42, 0.2)`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: ds.textDim,
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      Creating in
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: ds.ember,
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {selectedBonfire.name}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: "14px", color: ds.textSecondary, lineHeight: 1.6 }}>
                  Data Rooms allow the creation of Hyperblogs, please configure the settings here.
                </p>
                {/* Description + System Prompt */}
                <div className="space-y-4">
                  <WizardField
                    label="Title of Room"
                    required
                    counter={`${description.length}/500`}
                    hint="min 10 characters"
                    subtext="What is this data room about? This title informs which graph nodes are selected for Hyperblog creation."
                  >
                    <textarea
                      className="w-full resize-none outline-none placeholder:opacity-40"
                      rows={3}
                      placeholder="Enter the title of this data room"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      style={{
                        background: ds.surface,
                        border: `1px solid ${description.length > 0 && description.trim().length < 10 ? "rgba(220,50,50,0.4)" : ds.borderBright}`,
                        borderRadius: ds.radius,
                        padding: "14px 16px",
                        color: ds.text,
                        fontSize: "15px",
                        fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.65,
                      }}
                    />
                    {step2Attempted && description.trim().length < 10 && (
                      <p style={{ fontSize: "12px", color: "#ff6b6b", marginTop: "4px" }}>
                        Title must be at least 10 characters
                      </p>
                    )}
                  </WizardField>

                  <WizardField
                    label="Style Prompt"
                    counter={`${systemPrompt.length}/1000`}
                    subtext="This determines the voice of all hyperblogs minted from your data room."
                  >
                    <textarea
                      className="w-full resize-none outline-none placeholder:opacity-40"
                      rows={3}
                      placeholder="Describe the tone and style for generated hyperblogs..."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      maxLength={1000}
                      style={{
                        background: ds.surface,
                        border: `1px solid ${!isSystemPromptValid ? "rgba(220,50,50,0.4)" : ds.borderBright}`,
                        borderRadius: ds.radius,
                        padding: "14px 16px",
                        color: ds.text,
                        fontSize: "15px",
                        fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.65,
                      }}
                    />
                  </WizardField>
                </div>

                {/* Generation Panel */}
                <WizardPanel label="Generation">
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-0.5"
                  >
                    {/* Image Model */}
                    <div className="p-4 space-y-2" style={{ background: ds.surface }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: ds.textSecondary }}>
                        Banner Image Model
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { value: "schnell", label: "Schnell" },
                            { value: "dev", label: "Dev" },
                            { value: "pro", label: "Pro" },
                            { value: "realism", label: "Realism" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                            style={{
                              fontFamily: "'Montserrat', sans-serif",
                              background:
                                imageModel === opt.value ? ds.emberDim : "transparent",
                              border: `1px solid ${imageModel === opt.value ? "rgba(245,87,42,0.3)" : ds.border}`,
                              color:
                                imageModel === opt.value ? ds.ember : ds.textSecondary,
                            }}
                            onClick={() => setImageModel(opt.value)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* HTN Template */}
                    <div className="p-4 space-y-2" style={{ background: ds.surface }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: ds.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}>
                        Template
                        <span
                          title="This informs the Hyperblog output format"
                          style={{ cursor: "help", fontSize: "13px", color: ds.textDim, fontWeight: 400, textTransform: "none" as const, letterSpacing: "normal" }}
                        >
                          ⓘ
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        {selectedTemplate ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                              style={{
                                background: ds.emberDim,
                                color: ds.ember,
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: "10px",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase" as const,
                              }}
                            >
                              {selectedTemplate.template_type}
                            </span>
                            <span
                              className="truncate"
                              style={{ fontSize: "13px", color: ds.text }}
                            >
                              {selectedTemplate.name}
                            </span>
                            <button
                              className="text-xs cursor-pointer shrink-0"
                              style={{ color: ds.textDim }}
                              onClick={() => setSelectedTemplate(null)}
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <span
                            className="flex-1"
                            style={{ fontSize: "13px", color: ds.textDim }}
                          >
                            Auto
                          </span>
                        )}
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer"
                          style={{
                            fontFamily: "'Montserrat', sans-serif",
                            background: "transparent",
                            border: `1px solid ${ds.borderBright}`,
                            color: ds.textSecondary,
                          }}
                          onClick={() => setIsPickerOpen(true)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = ds.surface2;
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = ds.borderBright;
                          }}
                        >
                          {selectedTemplate ? "Change" : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                </WizardPanel>
              </div>
            )}

            {/* ══════════ Step 3: Center Node Selection ══════════ */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p style={{ fontSize: "14px", color: ds.textSecondary, lineHeight: 1.6 }}>
                  Hyperblogs are generated by AI queries, focused on the selected centre node.
                </p>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div
                      className="w-8 h-8 rounded-full border-2 animate-spin"
                      style={{
                        borderColor: ds.border,
                        borderTopColor: ds.ember,
                      }}
                    />
                    <p className="mt-4" style={{ fontSize: "13px", color: ds.textDim }}>
                      Querying knowledge graph...
                    </p>
                  </div>
                ) : previewEntities.length === 0 && !error ? (
                  <div
                    className="p-6 rounded-lg text-center"
                    style={{
                      background: ds.surface,
                      color: ds.textSecondary,
                      fontSize: "14px",
                    }}
                  >
                    No entities found. Go back and adjust your description.
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: "13px", color: ds.textDim }}>
                      {previewEntities.length} entities found
                    </p>
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 rounded-lg max-h-96 overflow-y-auto scrollbar-hide"
                    >
                      {previewEntities.map((entity) => {
                        const isSelected = selectedCenterNode?.uuid === entity.uuid;
                        return (
                          <button
                            key={entity.uuid}
                            type="button"
                            className="relative text-left p-4 transition-colors duration-200 cursor-pointer"
                            style={{
                              background: isSelected ? ds.surface2 : ds.surface,
                              outline: isSelected ? `2px solid ${ds.ember}` : "none",
                              outlineOffset: "-2px",
                              borderRadius: isSelected ? ds.radius : undefined,
                              zIndex: isSelected ? 1 : 0,
                            }}
                            onClick={() => setSelectedCenterNode(entity)}
                            onMouseEnter={(e) => {
                              if (!isSelected)
                                e.currentTarget.style.background = ds.surface2;
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected)
                                e.currentTarget.style.background = ds.surface;
                            }}
                          >
                            {isSelected && (
                              <div
                                className="absolute top-0 left-0 right-0 h-0.5"
                                style={{ background: ds.ember }}
                              />
                            )}
                            <div className="flex items-start gap-3">
                              <div
                                className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
                                style={{
                                  borderColor: isSelected ? ds.ember : ds.borderBright,
                                  background: isSelected ? ds.ember : "transparent",
                                }}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                {entity.entity_type !== "Unknown" && (
                                  <span
                                    className="inline-block mb-1 px-2 py-0.5 rounded text-xs"
                                    style={{
                                      fontFamily: "'Montserrat', sans-serif",
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      letterSpacing: "0.04em",
                                      textTransform: "uppercase" as const,
                                      background: ds.emberDim,
                                      color: ds.ember,
                                    }}
                                  >
                                    {entity.entity_type}
                                  </span>
                                )}
                                <p
                                  className="overflow-hidden break-words"
                                  style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: ds.text,
                                    marginBottom: "2px",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {entity.name}
                                </p>
                                {entity.summary && (
                                  <p
                                    className="line-clamp-2 break-words"
                                    style={{
                                      fontSize: "13px",
                                      color: ds.textSecondary,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {entity.summary}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            className="sticky bottom-0 px-8 py-5 flex items-center justify-between"
            style={{
              background: ds.bg,
              borderTop: `1px solid ${ds.border}`,
            }}
          >
            <button
              type="button"
              className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                background: "transparent",
                border: `1px solid ${ds.borderBright}`,
                color: ds.textSecondary,
              }}
              onClick={currentStep === 1 || (currentStep === 2 && isSubdomainScoped) ? onClose : handleBack}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = ds.surface;
                e.currentTarget.style.color = ds.text;
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = ds.textSecondary;
                e.currentTarget.style.borderColor = ds.borderBright;
              }}
            >
              {currentStep === 1 || (currentStep === 2 && isSubdomainScoped) ? "Cancel" : "Back"}
            </button>

            <button
              type="button"
              className="px-8 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                background: "#ffffff",
                color: ds.bg,
                boxShadow: "0 4px 24px rgba(245,87,42,0.2)",
              }}
              onClick={
                currentStep === 3 ? handleComplete : handleNext
              }
              disabled={
                (currentStep === 1 && !selectedBonfire) ||
                (currentStep === 2 && !isStep2Valid) ||
                (currentStep === 3 && (!selectedCenterNode || loading))
              }
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = "0.92";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(245,87,42,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(245,87,42,0.2)";
              }}
            >
              {currentStep === 3 ? "Create Data Room" : "Continue"}
            </button>
          </div>
        </div>
      </div>

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
          setIsCreatorOpen(false);
          setIsPickerOpen(true);
        }}
      />
    </>
  );
}

/* ── Sub-components ── */

function WizardField({
  label,
  required,
  counter,
  hint,
  subtext,
  children,
}: {
  label: string;
  required?: boolean;
  counter?: string;
  hint?: string;
  subtext?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: ds.text,
          }}
        >
          {label}
          {required && (
            <span style={{ color: ds.ember, marginLeft: "2px" }}>*</span>
          )}
        </label>
        <span style={{ fontSize: "12px", color: ds.textDim }}>
          {counter}
          {hint && <span className="ml-1">({hint})</span>}
        </span>
      </div>
      {subtext && (
        <p style={{ fontSize: "13px", color: ds.textSecondary, lineHeight: 1.5 }}>
          {subtext}
        </p>
      )}
      {children}
    </div>
  );
}

function WizardPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0">
      <p
        className="mb-2"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: ds.ember,
        }}
      >
        {label}
      </p>
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: `1px solid ${ds.border}` }}
      >
        {children}
      </div>
    </div>
  );
}

function WizardNumberInput({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="p-4 space-y-1.5" style={{ background: ds.surface }}>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          color: ds.textDim,
        }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <input
          type="number"
          className="bg-transparent outline-none w-full"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "24px",
            fontWeight: 800,
            color: ds.text,
            lineHeight: 1,
            /* Hide spinner arrows */
            MozAppearance: "textfield",
          }}
        />
        <span style={{ fontSize: "12px", color: ds.textDim, fontWeight: 500, whiteSpace: "nowrap" }}>
          {unit}
        </span>
      </div>
      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}`}</style>
    </div>
  );
}
