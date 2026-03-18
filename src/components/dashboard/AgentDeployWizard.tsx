"use client";

/**
 * AgentDeployWizard
 *
 * Modal wizard for deploying a new agent on a bonfire. 7 steps:
 *   1. Identity       — name, username, system prompt, timezone
 *   2. Deployment     — platform, bot token, reporting config
 *   3. Features       — agent feature toggles
 *   4. Chat Policies  — group/DM policies, user lists, server configs
 *   5. Tools & Env    — MCP tool selection, environment variables
 *   6. Personality    — initial personality traits
 *   7. Review & Deploy — summary + creation
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AgentDeployFormData,
  AgentDeployRequest,
  AgentUpdateRequest,
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
import { useAddPersonalityTraits, useAgentPersonality, useSkillsCatalog } from "@/hooks/useAgentConfig";
import { IdentitySection } from "@/components/agent-config/sections/IdentitySection";
import { DeploymentSection } from "@/components/agent-config/sections/DeploymentSection";
import { FeaturesSection } from "@/components/agent-config/sections/FeaturesSection";
import { ChatPoliciesSection } from "@/components/agent-config/sections/ChatPoliciesSection";
import { McpToolsSection } from "@/components/agent-config/sections/McpToolsSection";

// ── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Identity",
  "Deployment",
  "Features",
  "Chat Policies",
  "Tools & Env",
  "Personality",
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
  const addPersonalityTraits = useAddPersonalityTraits();
  const { data: mcpTools } = useMcpTools(isOpen);
  const { data: skillsCatalog } = useSkillsCatalog(isOpen);
  const { data: existingAgent, isLoading: isLoadingAgent } = useAgentDetails(
    isEditMode ? editAgentId : undefined,
  );
  const { data: existingPersonality } = useAgentPersonality(
    isEditMode ? editAgentId : undefined,
  );

  const activeMutation = isEditMode ? updateAgent : createAgent;

  // Token validation state
  const [tokenValidation, setTokenValidation] = useState<TokenValidationResult | null>(null);

  // Env var editor state
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");

  // Personality state (new traits to add)
  const [initialTraits, setInitialTraits] = useState<Array<{ section: string; content: string }>>(
    [],
  );
  const [newTraitSection, setNewTraitSection] = useState("");
  const [newTraitContent, setNewTraitContent] = useState("");

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
    setInitialTraits([]);
    setNewTraitSection("");
    setNewTraitContent("");
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

  // ── Personality helpers ────────────────────────────────────────────────

  const addTrait = useCallback(() => {
    const section = newTraitSection.trim();
    const content = newTraitContent.trim();
    if (!section || !content) return;
    setInitialTraits((prev) => [...prev, { section, content }]);
    setNewTraitSection("");
    setNewTraitContent("");
  }, [newTraitSection, newTraitContent]);

  const removeTrait = useCallback((index: number) => {
    setInitialTraits((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Step 1: Identity ───────────────────────────────────────────────────

  const nameValid = form.agentName.trim().length >= 1 && form.agentName.trim().length <= 60;
  const usernameValid = /^[a-z0-9_]{3,30}$/.test(form.agentUsername);
  const contextValid = form.agentContext.trim().length >= 10;
  const step1Valid = nameValid && usernameValid && contextValid;

  // ── Step 2: Deployment ─────────────────────────────────────────────────

  const currentToken =
    form.platform === "telegram" ? form.telegramBotToken : form.discordBotToken;
  const tokenProvided = currentToken.trim().length > 0;
  const tokenIsValid = tokenValidation?.valid === true;
  const step2Valid = tokenProvided && (!tokenProvided || tokenIsValid || !currentToken.trim());

  const handleValidateToken = useCallback(async () => {
    if (!currentToken.trim()) return;
    const result = await validateToken.mutateAsync({
      platform: form.platform as "telegram" | "discord",
      token: currentToken.trim(),
    });
    setTokenValidation(result);
  }, [currentToken, form.platform, validateToken]);

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

  // ── Step 7: Deploy ─────────────────────────────────────────────────────

  const handleDeploy = useCallback(async () => {
    try {
      if (isEditMode && editAgentId) {
        const payload: AgentUpdateRequest = {
          name: form.agentName.trim(),
          context: form.agentContext.trim(),
          is_active: form.isActive,
          timezone: form.timezone || undefined,
          chatConfig: form.chatConfig,
          agentFeatures: form.agentFeatures,
          enabledMcpTools: form.enabledMcpTools,
          enabledSkills: form.enabledSkills,
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
        await updateAgent.mutateAsync({ agentId: editAgentId, data: payload });
        if (initialTraits.length > 0) {
          await addPersonalityTraits.mutateAsync({
            agentId: editAgentId,
            traits: initialTraits,
          });
        }
      } else {
        const payload: AgentDeployRequest = {
          agentName: form.agentName.trim(),
          agentUsername: form.agentUsername.trim(),
          agentContext: form.agentContext.trim(),
          bonfireId,
          platform: form.platform,
          isActive: form.isActive,
          timezone: form.timezone || undefined,
          chatConfig: form.chatConfig,
          agentFeatures: form.agentFeatures,
          enabledMcpTools: form.enabledMcpTools.length > 0 ? form.enabledMcpTools : undefined,
          enabledSkills: form.enabledSkills.length > 0 ? form.enabledSkills : undefined,
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

        const result = await createAgent.mutateAsync(payload);
        if (initialTraits.length > 0 && result?._id) {
          try {
            await addPersonalityTraits.mutateAsync({
              agentId: result._id,
              traits: initialTraits,
            });
          } catch {
            // Non-fatal: traits can be added later via Personality tab
          }
        }
      }
    } catch {
      // Errors captured in activeMutation.isError
    }
  }, [
    form,
    bonfireId,
    createAgent,
    updateAgent,
    addPersonalityTraits,
    isEditMode,
    editAgentId,
    initialTraits,
  ]);

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
            <IdentitySection
              name={form.agentName}
              username={form.agentUsername}
              context={form.agentContext}
              timezone={form.timezone}
              disableUsername={isEditMode}
              onChangeName={(v) => update("agentName", v)}
              onChangeUsername={(v) => update("agentUsername", v)}
              onChangeContext={(v) => update("agentContext", v)}
              onChangeTimezone={(v) => update("timezone", v)}
              showValidation
            />

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
            <DeploymentSection
              platform={form.platform}
              telegramBotToken={form.telegramBotToken}
              discordBotToken={form.discordBotToken}
              reportingConfig={form.reportingConfig}
              tokenValidation={tokenValidation}
              onValidate={handleValidateToken}
              isValidating={validateToken.isPending}
              onChange={(patch) => {
                if (patch.platform !== undefined) {
                  update("platform", patch.platform);
                  setTokenValidation(null);
                }
                if (patch.telegramBotToken !== undefined)
                  update("telegramBotToken", patch.telegramBotToken);
                if (patch.discordBotToken !== undefined)
                  update("discordBotToken", patch.discordBotToken);
                if ("reportingConfig" in patch)
                  update("reportingConfig", patch.reportingConfig ?? null);
              }}
            />

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

        {/* ── Step 3: Features ──────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <FeaturesSection
              features={form.agentFeatures}
              onChange={(f) => update("agentFeatures", f)}
            />

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
            <ChatPoliciesSection
              config={form.chatConfig}
              onChange={(c) => update("chatConfig", c)}
            />

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
              <McpToolsSection
                tools={mcpTools ?? []}
                enabledTools={form.enabledMcpTools}
                onChange={(t) => update("enabledMcpTools", t)}
              />
            </div>

            {/* Skills */}
            {skillsCatalog && skillsCatalog.skills.length > 0 && (
              <div>
                <label className="label">
                  <span className="label-text font-semibold">
                    Skills ({form.enabledSkills.length} enabled)
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {skillsCatalog.skills.map((skill) => (
                    <label
                      key={skill.skillId}
                      className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-base-300"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary mt-0.5"
                        checked={form.enabledSkills.includes(skill.skillId)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.enabledSkills, skill.skillId]
                            : form.enabledSkills.filter((id) => id !== skill.skillId);
                          update("enabledSkills", next);
                        }}
                      />
                      <div>
                        <span className="text-sm font-medium">{skill.name}</span>
                        {skill.description && (
                          <p className="text-xs text-base-content/50">{skill.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="divider text-xs">Environment Variables</div>

            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm flex-1 font-mono"
                placeholder="KEY"
                value={envKey}
                onChange={(e) =>
                  setEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
                }
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
                  <div
                    key={k}
                    className="flex items-center gap-2 bg-base-200 rounded px-3 py-1.5 text-sm"
                  >
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

        {/* ── Step 6: Personality ───────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Personality Traits</h4>
              <p className="text-xs text-base-content/50 mb-3">
                Add initial personality traits. More can be added later via the Personality tab.
              </p>
            </div>

            {/* Existing traits (edit mode) */}
            {isEditMode && existingPersonality && existingPersonality.total_traits > 0 && (
              <div className="border border-base-300 rounded-lg p-3">
                <p className="text-xs font-medium text-base-content/60 mb-2">
                  Existing traits ({existingPersonality.total_traits})
                </p>
                {Object.entries(existingPersonality.sections).map(([section, traits]) => (
                  <div key={section} className="mb-2">
                    <span className="text-xs font-medium text-primary">{section}</span>
                    {traits.map((t) => (
                      <p key={t.id} className="text-xs text-base-content/60 ml-2 mt-0.5">
                        {t.content}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* New traits to add */}
            {initialTraits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Traits to add ({initialTraits.length}):</p>
                {initialTraits.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-base-200 rounded p-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-primary text-xs font-medium">{t.section}</span>
                      <p className="text-xs text-base-content/70 mt-0.5 whitespace-pre-wrap">
                        {t.content}
                      </p>
                    </div>
                    <button
                      className="btn btn-xs btn-ghost text-base-content/50 shrink-0"
                      onClick={() => removeTrait(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add trait form */}
            <div className="border border-base-300 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-medium">Add Trait</h4>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="Section (e.g. core_identity, communication_style)"
                value={newTraitSection}
                onChange={(e) => setNewTraitSection(e.target.value)}
              />
              <textarea
                className="textarea textarea-bordered w-full text-sm"
                placeholder="Trait content..."
                value={newTraitContent}
                onChange={(e) => setNewTraitContent(e.target.value)}
                rows={3}
              />
              <button
                className="btn btn-sm btn-outline"
                onClick={addTrait}
                disabled={!newTraitSection.trim() || !newTraitContent.trim()}
              >
                Add Trait
              </button>
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-outline" onClick={() => setStep(4)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(6)}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Step 7: Review & Deploy ──────────────────────────── */}
        {step === 6 && !activeMutation.isSuccess && (
          <div className="space-y-4">
            <div className="border border-base-300 rounded-lg divide-y divide-base-300">
              <ReviewRow label="Name" value={form.agentName} />
              <ReviewRow label="Username" value={`@${form.agentUsername}`} mono />
              <ReviewRow label="Platform" value={form.platform} />
              <ReviewRow label="Bonfire" value={bonfireName} />
              <ReviewRow
                label="System Prompt"
                value={
                  form.agentContext.length > 80
                    ? form.agentContext.slice(0, 80) + "..."
                    : form.agentContext
                }
              />
              {form.enabledMcpTools.length > 0 && (
                <ReviewRow label="MCP Tools" value={form.enabledMcpTools.join(", ")} />
              )}
              {form.enabledSkills.length > 0 && (
                <ReviewRow label="Skills" value={`${form.enabledSkills.length} skill(s)`} />
              )}
              {Object.keys(form.agentEnvVars).length > 0 && (
                <ReviewRow
                  label="Env Vars"
                  value={`${Object.keys(form.agentEnvVars).length} variable(s)`}
                />
              )}
              {initialTraits.length > 0 && (
                <ReviewRow
                  label="Personality Traits"
                  value={`${initialTraits.length} trait(s) to add`}
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
                <span>
                  {activeMutation.error?.message ??
                    `Failed to ${isEditMode ? "update" : "create"} agent`}
                </span>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button
                className="btn btn-outline"
                onClick={() => setStep(5)}
                disabled={activeMutation.isPending}
              >
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
              <ReviewRow
                label="Platform"
                value={createAgent.data.deploymentConfiguration.platform}
              />
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
