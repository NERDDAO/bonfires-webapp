"use client";

/**
 * AgentDeployWizard
 *
 * Modal wizard for deploying a new agent on a bonfire. 6 steps:
 *   1. Identity       — name, username, system prompt, timezone
 *   2. Deployment     — platform, bot token, reporting config
 *   3. Features       — capability tags, agent feature toggles
 *   4. Chat Policies  — group/DM policies, allowed users, storage
 *   5. Tools & Env    — MCP tool selection, environment variables
 *   6. Review & Deploy — summary + creation
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AgentDeployFormData,
  AgentDeployRequest,
  AgentFullResponse,
  AgentPlatform,
  AgentUpdateRequest,
  McpTool,
  TokenValidationResult,
} from "@/types/agent-config";
import { agentResponseToFormData, createDefaultFormData } from "@/types/agent-config";

import {
  useAgentDetails,
  useCreateAgent,
  useMcpTools,
  useUpdateAgent,
  useValidateToken,
} from "@/hooks/useAgentDeploy";

// ── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Identity",
  "Deployment",
  "Features",
  "Chat Policies",
  "Tools & Env",
  "Review",
] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <ul className="steps steps-horizontal w-full mb-6 text-xs">
      {STEP_LABELS.map((label, i) => (
        <li
          key={label}
          className={`step ${current > i ? "step-success" : current === i ? "step-primary" : ""}`}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface AgentDeployWizardProps {
  bonfireId: string;
  bonfireName: string;
  isOpen: boolean;
  onClose: () => void;
  editAgentId?: string;
}

// ── Main component ───────────────────────────────────────────────────────────

export function AgentDeployWizard({
  bonfireId,
  bonfireName,
  isOpen,
  onClose,
  editAgentId,
}: AgentDeployWizardProps) {
  const isEditMode = !!editAgentId;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AgentDeployFormData>(createDefaultFormData);
  const [formInitialized, setFormInitialized] = useState(false);

  // Mutations & queries
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const validateToken = useValidateToken();
  const { data: mcpTools } = useMcpTools(isOpen);
  const { data: existingAgent, isLoading: isLoadingAgent } = useAgentDetails(
    isEditMode ? editAgentId : undefined,
  );

  const activeMutation = isEditMode ? updateAgent : createAgent;

  // Token validation state
  const [tokenValidation, setTokenValidation] = useState<TokenValidationResult | null>(null);

  // Env var editor state
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");

  // Capability input
  const [capInput, setCapInput] = useState("");

  // ── Dialog open/close ──────────────────────────────────────────────────

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEditMode && existingAgent && !formInitialized) {
      setForm(agentResponseToFormData(existingAgent));
      setFormInitialized(true);
    }
  }, [isEditMode, existingAgent, formInitialized]);

  const handleClose = useCallback(() => {
    setStep(0);
    setForm(createDefaultFormData());
    setFormInitialized(false);
    setTokenValidation(null);
    createAgent.reset();
    updateAgent.reset();
    onClose();
  }, [onClose, createAgent, updateAgent]);

  // ── Form updater ───────────────────────────────────────────────────────

  const update = useCallback(
    <K extends keyof AgentDeployFormData>(key: K, value: AgentDeployFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ── Step 1: Identity ───────────────────────────────────────────────────

  const nameValid = form.agentName.trim().length >= 1 && form.agentName.trim().length <= 60;
  const usernameValid = /^[a-z0-9_]{3,30}$/.test(form.agentUsername);
  const contextValid = form.agentContext.trim().length >= 10;
  const step1Valid = nameValid && usernameValid && contextValid;

  // ── Step 2: Deployment ─────────────────────────────────────────────────

  const needsToken = form.platform === "telegram" || form.platform === "discord";
  const currentToken =
    form.platform === "telegram" ? form.telegramBotToken : form.discordBotToken;
  const tokenProvided = needsToken ? currentToken.trim().length > 0 : true;
  const tokenIsValid = needsToken ? tokenValidation?.valid === true : true;
  const step2Valid = tokenProvided && (!needsToken || tokenIsValid || !currentToken.trim());

  const handleValidateToken = useCallback(async () => {
    if (!currentToken.trim()) return;
    const result = await validateToken.mutateAsync({
      platform: form.platform as "telegram" | "discord",
      token: currentToken.trim(),
    });
    setTokenValidation(result);
  }, [currentToken, form.platform, validateToken]);

  const handlePlatformChange = useCallback(
    (platform: AgentPlatform) => {
      update("platform", platform);
      setTokenValidation(null);
    },
    [update],
  );

  // ── Step 3: Capabilities ───────────────────────────────────────────────

  const addCapability = useCallback(() => {
    const trimmed = capInput.trim();
    if (trimmed && form.capabilities.length < 10 && !form.capabilities.includes(trimmed)) {
      update("capabilities", [...form.capabilities, trimmed]);
    }
    setCapInput("");
  }, [capInput, form.capabilities, update]);

  const removeCapability = useCallback(
    (tag: string) => {
      update(
        "capabilities",
        form.capabilities.filter((c) => c !== tag),
      );
    },
    [form.capabilities, update],
  );

  // ── Step 5: Env vars ───────────────────────────────────────────────────

  const addEnvVar = useCallback(() => {
    const k = envKey.trim();
    const v = envValue.trim();
    if (k && v) {
      update("agentEnvVars", { ...form.agentEnvVars, [k]: v });
      setEnvKey("");
      setEnvValue("");
    }
  }, [envKey, envValue, form.agentEnvVars, update]);

  const removeEnvVar = useCallback(
    (key: string) => {
      const next = { ...form.agentEnvVars };
      delete next[key];
      update("agentEnvVars", next);
    },
    [form.agentEnvVars, update],
  );

  // ── Step 6: Deploy ─────────────────────────────────────────────────────

  const handleDeploy = useCallback(async () => {
    if (isEditMode && editAgentId) {
      const payload: AgentUpdateRequest = {
        name: form.agentName.trim(),
        context: form.agentContext.trim(),
        is_active: form.isActive,
        capabilities: form.capabilities,
        timezone: form.timezone || undefined,
        chatConfig: form.chatConfig,
        agentFeatures: form.agentFeatures,
        enabledMcpTools: form.enabledMcpTools,
        agentEnvVars:
          Object.keys(form.agentEnvVars).length > 0 ? form.agentEnvVars : undefined,
        deploymentConfiguration: {
          platform: form.platform,
          bonfireId,
          ...(form.platform === "telegram" && form.telegramBotToken.trim()
            ? { telegramBotToken: form.telegramBotToken.trim() }
            : {}),
          ...(form.platform === "discord" && form.discordBotToken.trim()
            ? { discordBotToken: form.discordBotToken.trim() }
            : {}),
          ...(form.reportingConfig ? { reportingConfig: form.reportingConfig } : {}),
        },
      };
      updateAgent.mutate({ agentId: editAgentId, data: payload });
    } else {
      const payload: AgentDeployRequest = {
        agentName: form.agentName.trim(),
        agentUsername: form.agentUsername.trim(),
        agentContext: form.agentContext.trim(),
        bonfireId,
        platform: form.platform,
        isActive: form.isActive,
        capabilities: form.capabilities,
        timezone: form.timezone || undefined,
        chatConfig: form.chatConfig,
        agentFeatures: form.agentFeatures,
        enabledMcpTools: form.enabledMcpTools.length > 0 ? form.enabledMcpTools : undefined,
        agentEnvVars:
          Object.keys(form.agentEnvVars).length > 0 ? form.agentEnvVars : undefined,
      };

      if (form.platform === "telegram" && form.telegramBotToken.trim()) {
        payload.telegramBotToken = form.telegramBotToken.trim();
      }
      if (form.platform === "discord" && form.discordBotToken.trim()) {
        payload.discordBotToken = form.discordBotToken.trim();
      }
      if (form.reportingConfig) {
        payload.reportingConfig = form.reportingConfig;
      }

      createAgent.mutate(payload);
    }
  }, [form, bonfireId, createAgent, updateAgent, isEditMode, editAgentId]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <dialog ref={dialogRef} className="modal" onClose={handleClose}>
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={handleClose}
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-1">
          {isEditMode ? "Edit Agent" : "Deploy Agent"}
        </h3>
        <p className="text-sm text-base-content/60 mb-4">
          on <span className="font-semibold">{bonfireName}</span>
        </p>

        {isEditMode && isLoadingAgent && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {!(isEditMode && isLoadingAgent) && !activeMutation.isSuccess && (
          <StepIndicator current={step} />
        )}

        {/* ── Step 1: Identity ──────────────────────────────────── */}
        {!(isEditMode && isLoadingAgent) && step === 0 && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Agent Name *</span>
                <span className="label-text-alt">{form.agentName.length}/60</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${form.agentName && !nameValid ? "input-error" : ""}`}
                placeholder="My Research Agent"
                value={form.agentName}
                onChange={(e) => update("agentName", e.target.value)}
                maxLength={60}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Username *</span>
                <span className="label-text-alt">lowercase, 3-30 chars</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full font-mono ${form.agentUsername && !usernameValid ? "input-error" : ""}`}
                placeholder="my_research_agent"
                value={form.agentUsername}
                onChange={(e) => update("agentUsername", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={30}
                disabled={isEditMode}
              />
              {form.agentUsername && !usernameValid && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    3-30 characters: lowercase letters, numbers, underscores
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">System Prompt *</span>
                <span className="label-text-alt">min 10 chars</span>
              </label>
              <textarea
                className={`textarea textarea-bordered h-28 w-full ${form.agentContext && !contextValid ? "textarea-error" : ""}`}
                placeholder="You are a research assistant specializing in..."
                value={form.agentContext}
                onChange={(e) => update("agentContext", e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Timezone <span className="font-normal text-base-content/50">(optional)</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="America/New_York"
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
              />
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn btn-primary" disabled={!step1Valid} onClick={() => setStep(1)}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Deployment ────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Platform</span>
              </label>
              <div className="flex gap-2">
                {(["web", "telegram", "discord"] as const).map((p) => (
                  <button
                    key={p}
                    className={`btn btn-sm ${form.platform === p ? "btn-primary" : "btn-outline"}`}
                    onClick={() => handlePlatformChange(p)}
                  >
                    {p === "web" ? "Web (API)" : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {needsToken && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {form.platform === "telegram" ? "Telegram" : "Discord"} Bot Token
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="input input-bordered flex-1 font-mono"
                    placeholder="Paste your bot token..."
                    value={currentToken}
                    onChange={(e) =>
                      update(
                        form.platform === "telegram" ? "telegramBotToken" : "discordBotToken",
                        e.target.value,
                      )
                    }
                  />
                  <button
                    className="btn btn-outline btn-sm self-center"
                    disabled={!currentToken.trim() || validateToken.isPending}
                    onClick={handleValidateToken}
                  >
                    {validateToken.isPending ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      "Validate"
                    )}
                  </button>
                </div>
                {tokenValidation && (
                  <div className={`mt-2 text-sm ${tokenValidation.valid ? "text-success" : "text-error"}`}>
                    {tokenValidation.valid
                      ? `Valid bot: @${tokenValidation.username}`
                      : `Invalid: ${tokenValidation.error}`}
                  </div>
                )}
              </div>
            )}

            <div className="collapse collapse-arrow bg-base-200 rounded-lg">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-semibold">Reporting Config (optional)</div>
              <div className="collapse-content space-y-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-sm">Chat ID</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="Telegram chat ID or Discord channel ID"
                    value={form.reportingConfig?.chatId ?? ""}
                    onChange={(e) => {
                      const chatId = e.target.value;
                      if (!chatId) {
                        update("reportingConfig", null);
                      } else {
                        update("reportingConfig", {
                          chatId,
                          topicId: form.reportingConfig?.topicId,
                          shouldNotIgnore: form.reportingConfig?.shouldNotIgnore,
                        });
                      }
                    }}
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-sm">Topic ID (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="Topic ID within the chat"
                    value={form.reportingConfig?.topicId ?? ""}
                    onChange={(e) => {
                      if (form.reportingConfig) {
                        update("reportingConfig", {
                          ...form.reportingConfig,
                          topicId: e.target.value || undefined,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-outline" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary" disabled={!step2Valid} onClick={() => setStep(2)}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Features & Capabilities ──────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Capabilities <span className="font-normal text-base-content/50">(optional)</span>
                </span>
                <span className="label-text-alt">{form.capabilities.length}/10</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  placeholder="Type and press Enter..."
                  value={capInput}
                  onChange={(e) => setCapInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCapability();
                    }
                  }}
                  disabled={form.capabilities.length >= 10}
                />
                <button className="btn btn-outline btn-sm self-center" onClick={addCapability} disabled={!capInput.trim()}>
                  Add
                </button>
              </div>
              {form.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.capabilities.map((cap) => (
                    <span key={cap} className="badge badge-outline gap-1">
                      {cap}
                      <button
                        className="text-base-content/50 hover:text-base-content leading-none"
                        onClick={() => removeCapability(cap)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="divider text-xs">Agent Features</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ["isImageInputEnabled", "Image Input"],
                ["isAudioInputEnabled", "Audio Input"],
                ["isDocumentInputEnabled", "Document Input"],
                ["isImageGenerationEnabled", "Image Generation"],
                ["allowScheduling", "Task Scheduling"],
              ] as const).map(([key, label]) => (
                <label key={key} className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={form.agentFeatures[key]}
                    onChange={(e) =>
                      update("agentFeatures", {
                        ...form.agentFeatures,
                        [key]: e.target.checked,
                      })
                    }
                  />
                  <span className="label-text">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Chat Policies ─────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Group Policy</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={form.chatConfig.groupPolicy ?? "open"}
                  onChange={(e) =>
                    update("chatConfig", {
                      ...form.chatConfig,
                      groupPolicy: e.target.value as "open" | "restricted",
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">DM Policy</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={form.chatConfig.dmPolicy ?? "open"}
                  onChange={(e) =>
                    update("chatConfig", {
                      ...form.chatConfig,
                      dmPolicy: e.target.value as "open" | "restricted" | "disabled",
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={form.chatConfig.silentMode ?? false}
                onChange={(e) =>
                  update("chatConfig", { ...form.chatConfig, silentMode: e.target.checked })
                }
              />
              <span className="label-text">Silent Mode</span>
            </label>

            <div className="divider text-xs">Storage Settings</div>

            <div className="space-y-2">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={form.chatConfig.disableStoringGroups ?? false}
                  onChange={(e) =>
                    update("chatConfig", {
                      ...form.chatConfig,
                      disableStoringGroups: e.target.checked,
                    })
                  }
                />
                <span className="label-text">Disable storing group messages</span>
              </label>

              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={form.chatConfig.disableStoringDMs ?? false}
                  onChange={(e) =>
                    update("chatConfig", {
                      ...form.chatConfig,
                      disableStoringDMs: e.target.checked,
                    })
                  }
                />
                <span className="label-text">Disable storing DM messages</span>
              </label>
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-outline" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Tools & Environment ──────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text font-semibold">MCP Tools</span>
              </label>
              {mcpTools && mcpTools.length > 0 ? (
                <div className="space-y-2">
                  {mcpTools.map((tool: McpTool) => (
                    <label key={tool.id} className="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg px-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={form.enabledMcpTools.includes(tool.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.enabledMcpTools, tool.id]
                            : form.enabledMcpTools.filter((id) => id !== tool.id);
                          update("enabledMcpTools", next);
                        }}
                      />
                      <div>
                        <span className="label-text font-medium">{tool.name}</span>
                        {tool.description && (
                          <p className="text-xs text-base-content/50">{tool.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/50">No tools available</p>
              )}
            </div>

            <div className="divider text-xs">Environment Variables</div>

            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm flex-1 font-mono"
                placeholder="KEY"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
              />
              <input
                type="text"
                className="input input-bordered input-sm flex-1 font-mono"
                placeholder="value"
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
              />
              <button
                className="btn btn-outline btn-sm"
                onClick={addEnvVar}
                disabled={!envKey.trim() || !envValue.trim()}
              >
                Add
              </button>
            </div>

            {Object.keys(form.agentEnvVars).length > 0 && (
              <div className="space-y-1">
                {Object.entries(form.agentEnvVars).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 bg-base-200 rounded px-3 py-1.5 text-sm">
                    <span className="font-mono font-semibold">{k}</span>
                    <span className="text-base-content/40">=</span>
                    <span className="font-mono flex-1 truncate text-base-content/70">
                      {"•".repeat(Math.min(v.length, 20))}
                    </span>
                    <button
                      className="btn btn-xs btn-ghost text-base-content/50"
                      onClick={() => removeEnvVar(k)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button className="btn btn-outline" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(5)}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Step 6: Review & Deploy ──────────────────────────── */}
        {step === 5 && !activeMutation.isSuccess && (
          <div className="space-y-4">
            <div className="border border-base-300 rounded-lg divide-y divide-base-300">
              <ReviewRow label="Name" value={form.agentName} />
              <ReviewRow label="Username" value={`@${form.agentUsername}`} mono />
              <ReviewRow label="Platform" value={form.platform} />
              <ReviewRow label="Bonfire" value={bonfireName} />
              <ReviewRow
                label="System Prompt"
                value={form.agentContext.length > 80 ? form.agentContext.slice(0, 80) + "..." : form.agentContext}
              />
              {form.capabilities.length > 0 && (
                <ReviewRow label="Capabilities" value={form.capabilities.join(", ")} />
              )}
              {form.enabledMcpTools.length > 0 && (
                <ReviewRow label="MCP Tools" value={form.enabledMcpTools.join(", ")} />
              )}
              {Object.keys(form.agentEnvVars).length > 0 && (
                <ReviewRow
                  label="Env Vars"
                  value={`${Object.keys(form.agentEnvVars).length} variable(s)`}
                />
              )}
              <ReviewRow label="Active" value={form.isActive ? "Yes" : "No (draft)"} />
            </div>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={form.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
              />
              <span className="label-text">Activate agent immediately</span>
            </label>

            {activeMutation.isError && (
              <div className="alert alert-error text-sm">
                <span>{activeMutation.error?.message ?? `Failed to ${isEditMode ? "update" : "create"} agent`}</span>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button className="btn btn-outline" onClick={() => setStep(4)} disabled={activeMutation.isPending}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDeploy}
                disabled={activeMutation.isPending}
              >
                {activeMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    {isEditMode ? "Saving..." : "Deploying..."}
                  </>
                ) : isEditMode ? (
                  "Save Changes"
                ) : (
                  "Deploy Agent"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Success ──────────────────────────────────────────── */}
        {!isEditMode && createAgent.isSuccess && createAgent.data && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">🤖</div>
            <h3 className="text-xl font-bold">Agent Deployed!</h3>
            <p className="text-sm text-base-content/60">
              <span className="font-semibold">{createAgent.data.name}</span> is now
              {form.isActive ? " active" : " created (inactive)"} on{" "}
              <span className="font-semibold">{bonfireName}</span>.
            </p>

            <div className="border border-base-300 rounded-lg divide-y divide-base-300 text-left">
              <ReviewRow label="Agent ID" value={createAgent.data._id} mono />
              <ReviewRow label="Username" value={`@${createAgent.data.username}`} mono />
              <ReviewRow label="Platform" value={createAgent.data.deploymentConfiguration.platform} />
            </div>

            <button className="btn btn-primary mt-4" onClick={handleClose}>
              Done
            </button>
          </div>
        )}

        {isEditMode && updateAgent.isSuccess && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">&#9989;</div>
            <h3 className="text-xl font-bold">Agent Updated!</h3>
            <p className="text-sm text-base-content/60">
              Changes to <span className="font-semibold">{form.agentName}</span> have been saved.
            </p>
            <button className="btn btn-primary mt-4" onClick={handleClose}>
              Done
            </button>
          </div>
        )}
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}

// ── Review row helper ────────────────────────────────────────────────────────

function ReviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 px-4 py-2.5 text-sm">
      <span className="text-base-content/60 shrink-0">{label}</span>
      <span className={`text-right truncate ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
