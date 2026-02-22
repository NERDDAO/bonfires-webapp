"use client";

/**
 * ProvisionWizard
 *
 * 5-step page wizard for ERC-1155 token-gated Bonfire provisioning:
 *   1. Connect & Verify  — wallet + chain + token check
 *   2. Configure         — Bonfire name, description, capabilities
 *   3. Review            — on-chain / off-chain summary
 *   4. Processing        — 4 sequential sub-steps with live status
 *   5. Success           — credential display + CTAs
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { mainnet } from "viem/chains";

import type { ProcessingStep, ProvisionFormData, ProvisionResult } from "@/types";

import { useBonfireToken } from "@/hooks/web3/useBonfireToken";
import { useProvision } from "@/hooks/web3/useProvision";

const ERC1155_TOKEN_ID = process.env["NEXT_PUBLIC_ERC1155_TOKEN_ID"] ?? "1";
const ERC1155_CONTRACT =
  process.env["NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS"] ??
  "0x0000000000000000000000000000000000000000";

// ── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = ["Connect", "Configure", "Review", "Processing", "Success"] as const;

interface StepIndicatorProps {
  current: number;
}

function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <ul className="steps w-full mb-8">
      {STEP_LABELS.map((label, i) => (
        <li
          key={label}
          className={`step text-xs ${current > i ? "step-success" : current === i ? "step-primary" : ""}`}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

// ── Sub-step status row (Step 4) ────────────────────────────────────────────

type SubStepStatus = "pending" | "active" | "done" | "error";

interface SubStepRowProps {
  index: number;
  label: string;
  status: SubStepStatus;
  detail?: string;
  txHash?: string;
  onRetry?: () => void;
}

function SubStepRow({ index, label, status, detail, txHash, onRetry }: SubStepRowProps) {
  const iconEl = () => {
    if (status === "done") return <span className="text-success text-base">✓</span>;
    if (status === "active")
      return <span className="loading loading-spinner loading-sm text-primary" />;
    if (status === "error") return <span className="text-error text-base">✕</span>;
    return (
      <span className="text-base-content/40 text-xs font-semibold">{index + 1}</span>
    );
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-base-200 last:border-0">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
          ${status === "done" ? "bg-success/10" : ""}
          ${status === "active" ? "bg-primary/10" : ""}
          ${status === "error" ? "bg-error/10" : ""}
          ${status === "pending" ? "bg-base-200" : ""}
        `}
      >
        {iconEl()}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            status === "pending" ? "text-base-content/40" : "text-base-content"
          }`}
        >
          {label}
        </p>
        {detail && (
          <p className="text-xs text-base-content/60 mt-0.5 truncate">{detail}</p>
        )}
        {txHash && (
          <a
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline mt-0.5 block truncate"
          >
            {txHash.slice(0, 12)}…{txHash.slice(-6)} ↗ Etherscan
          </a>
        )}
        {status === "error" && onRetry && (
          <button className="btn btn-xs btn-outline mt-1" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// ── Credential card (Step 5) ─────────────────────────────────────────────────

interface CredCardProps {
  label: string;
  value: string;
  link?: string;
}

function CredCard({ label, value, link }: CredCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-base-300 rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-base-content flex-1 truncate">
          {value}
        </span>
        <button
          className="btn btn-xs btn-ghost"
          onClick={handleCopy}
          title="Copy"
        >
          {copied ? "✓" : "⎘"}
        </button>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xs btn-ghost text-primary"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────

export function ProvisionWizard() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const { balance, isLoading: tokenLoading } = useBonfireToken();
  const { state: processingState, provision, reset: resetProvision, retry: retryProvision } = useProvision();

  const [step, setStep] = useState(0);

  // Form state
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capabilityInput, setCapabilityInput] = useState("");

  // Step 5 result
  const [result, setResult] = useState<ProvisionResult | null>(null);

  // Track the last non-error step for correct sub-step status rendering
  const lastActiveStepRef = useRef<ProcessingStep>("ipfs");

  // Track if processing has started to avoid double-invocations
  const processingStarted = useRef(false);

  const isOnMainnet = chainId === mainnet.id;

  // ── Step 1 validation ────────────────────────────────────────────────────

  const step1Valid = isConnected && isOnMainnet && balance > 0n;

  // ── Step 2 validation ────────────────────────────────────────────────────

  const nameValid = agentName.trim().length >= 1 && agentName.trim().length <= 60;
  const descriptionValid =
    description.trim().length >= 10 && description.trim().length <= 300;
  const step2Valid = nameValid && descriptionValid;

  // ── Capability tag input ─────────────────────────────────────────────────

  const addCapability = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && capabilities.length < 10 && !capabilities.includes(trimmed)) {
        setCapabilities((prev) => [...prev, trimmed]);
      }
      setCapabilityInput("");
    },
    [capabilities]
  );

  const handleCapabilityKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCapability(capabilityInput);
      }
    },
    [capabilityInput, addCapability]
  );

  const removeCapability = useCallback((tag: string) => {
    setCapabilities((prev) => prev.filter((c) => c !== tag));
  }, []);

  // ── Step 3 → 4: kick off provisioning ────────────────────────────────────

  const handleProvision = useCallback(async () => {
    if (!step2Valid) return;

    setStep(3);
    processingStarted.current = false;
  }, [step2Valid]);

  useEffect(() => {
    if (step !== 3 || processingStarted.current) return;

    processingStarted.current = true;

    const formData: ProvisionFormData = {
      agentName: agentName.trim(),
      description: description.trim(),
      capabilities,
    };

    provision(formData)
      .then((provisionResult) => {
        setResult(provisionResult);
        setStep(4);
      })
      .catch(() => {
        // state.step === "error" is set by the hook; stay on step 3
      });
  }, [step, agentName, description, capabilities, provision]);

  // ── Sub-step display mapping ──────────────────────────────────────────────

  // Keep lastActiveStepRef in sync with the current non-error step
  useEffect(() => {
    if (processingState.step !== "error") {
      lastActiveStepRef.current = processingState.step;
    }
  }, [processingState.step]);

  const subStepStatus = useCallback(
    (subStep: ProcessingStep): SubStepStatus => {
      const order: ProcessingStep[] = ["ipfs", "approval", "tx", "backend", "done"];
      const activeStep =
        processingState.step === "error"
          ? lastActiveStepRef.current
          : processingState.step;
      const currentIdx = order.indexOf(activeStep);
      const subIdx = order.indexOf(subStep);

      if (processingState.step === "error" && subIdx === currentIdx) return "error";
      if (subIdx < currentIdx) return "done";
      if (subIdx === currentIdx) return "active";
      return "pending";
    },
    [processingState.step]
  );

  const handleRetry = useCallback(() => {
    processingStarted.current = false;
    retryProvision();
    setStep(2);
    setTimeout(() => setStep(3), 0);
  }, [retryProvision]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-base-100 flex items-start justify-center pt-12 pb-16 px-4">
      <div className="w-full max-w-xl bg-base-100 rounded-xl border border-base-300 p-8 shadow-sm">
        <StepIndicator current={step} />

        {/* ── Step 1: Connect & Verify ───────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold mb-1">Connect Your Wallet</h2>
            <p className="text-sm text-base-content/60 mb-6">
              Connect a wallet on Ethereum Mainnet that holds your ERC-1155 access
              token.
            </p>

            <div className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center space-y-4">
              {!isConnected ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-base-content/60">No wallet connected</p>
                  <ConnectButton />
                </div>
              ) : !isOnMainnet ? (
                <div className="space-y-3">
                  <div className="alert alert-warning text-sm">
                    <span>Switch to Ethereum Mainnet to continue</span>
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => switchChainAsync({ chainId: mainnet.id })}
                  >
                    Switch Network
                  </button>
                </div>
              ) : tokenLoading ? (
                <span className="loading loading-spinner loading-md" />
              ) : balance > 0n ? (
                <div className="space-y-2">
                  <span className="badge badge-success badge-lg gap-1">
                    ✓ 1 access token available (Token #{ERC1155_TOKEN_ID})
                  </span>
                  <p className="text-xs text-base-content/50">
                    You hold {balance.toString()} token
                    {balance !== 1n ? "s" : ""} · Ethereum Mainnet
                  </p>
                </div>
              ) : (
                <div className="alert alert-warning text-sm">
                  <span>
                    No access token detected. You need token #{ERC1155_TOKEN_ID}{" "}
                    from contract{" "}
                    <span className="font-mono">
                      {ERC1155_CONTRACT.slice(0, 8)}…
                    </span>{" "}
                    to proceed.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="btn btn-primary"
                disabled={!step1Valid}
                onClick={() => setStep(1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Configure ─────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-1">Configure Your Bonfire</h2>
            <p className="text-sm text-base-content/60 mb-6">
              This information will be published on-chain via ERC-8004 and used to
              set up your Delve stack.
            </p>

            <div className="space-y-5">
              {/* Bonfire Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Bonfire Name *</span>
                  <span className="label-text-alt">
                    {agentName.length} / 60
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${
                    agentName.length > 0 && !nameValid ? "input-error" : ""
                  }`}
                  placeholder="My Research Bonfire"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  maxLength={60}
                />
                {agentName.length > 0 && !nameValid && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      Name must be between 1 and 60 characters
                    </span>
                  </label>
                )}
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Description *</span>
                  <span className="label-text-alt">
                    {description.length} / 300 (min 10)
                  </span>
                </label>
                <textarea
                  className={`textarea textarea-bordered h-24 w-full ${
                    description.length > 0 && !descriptionValid
                      ? "textarea-error"
                      : ""
                  }`}
                  placeholder="A knowledge bonfire specialising in…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                />
                {description.length > 0 && !descriptionValid && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {description.length < 10
                        ? "Description must be at least 10 characters"
                        : "Description must be at most 300 characters"}
                    </span>
                  </label>
                )}
              </div>

              {/* Capabilities */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Capabilities{" "}
                    <span className="font-normal text-base-content/50">
                      (optional)
                    </span>
                  </span>
                  <span className="label-text-alt">
                    {capabilities.length} / 10
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Type a capability and press Enter…"
                  value={capabilityInput}
                  onChange={(e) => setCapabilityInput(e.target.value)}
                  onKeyDown={handleCapabilityKeyDown}
                  disabled={capabilities.length >= 10}
                />
                {capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="badge badge-outline gap-1"
                      >
                        {cap}
                        <button
                          type="button"
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
            </div>

            <div className="flex justify-between mt-6">
              <button className="btn btn-outline" onClick={() => setStep(0)}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                disabled={!step2Valid}
                onClick={() => setStep(2)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review ────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-1">Review & Confirm</h2>
            <p className="text-sm text-base-content/60 mb-6">
              One provisioning transaction will execute all of the following actions.
              Approval may be required first.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="border border-base-300 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">⛓ On-Chain</h3>
                <ul className="space-y-2 text-sm text-base-content/80">
                  <li className="flex items-start gap-2">
                    <span>🔥</span>
                    <span>
                      Burn Token #{ERC1155_TOKEN_ID} from{" "}
                      <span className="font-mono">
                        {ERC1155_CONTRACT.slice(0, 8)}…
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🪪</span>
                    <span>
                      Register &ldquo;{agentName}&rdquo; on ERC-8004 Identity
                      Registry
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border border-base-300 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">☁️ Off-Chain</h3>
                <ul className="space-y-2 text-sm text-base-content/80">
                  <li className="flex items-start gap-2">
                    <span>🔥</span>
                    <span>Create Bonfire &ldquo;{agentName}&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🤖</span>
                    <span>Create Agent inside Bonfire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🔑</span>
                    <span>Generate API key (dashboard reveal)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="alert alert-warning text-sm mb-5">
              <span>
                ⚠️ Your ERC-1155 token will be permanently burned. This action
                cannot be undone.
              </span>
            </div>

            <div className="flex justify-between">
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={handleProvision}>
                Provision Bonfire
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Processing ────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-1">Provisioning in Progress</h2>
            <p className="text-sm text-base-content/60 mb-6">
              Please do not close this tab.
            </p>

            <div className="rounded-lg border border-base-200 overflow-hidden">
              <SubStepRow
                index={0}
                label="Uploading metadata to IPFS"
                status={subStepStatus("ipfs")}
                detail={
                  processingState.step !== "ipfs" &&
                  processingState.step !== "error"
                    ? "Complete"
                    : undefined
                }
                onRetry={
                  processingState.step === "error" ? handleRetry : undefined
                }
              />
              <SubStepRow
                index={1}
                label="Wallet actions (approval + provision)"
                status={subStepStatus("approval")}
                onRetry={
                  processingState.step === "error" ? handleRetry : undefined
                }
              />
              <SubStepRow
                index={2}
                label="Confirming on Ethereum Mainnet"
                status={subStepStatus("tx")}
                txHash={processingState.txHash}
                onRetry={
                  processingState.step === "error" ? handleRetry : undefined
                }
              />
              <SubStepRow
                index={3}
                label="Creating Bonfire, API key & Agent"
                status={subStepStatus("backend")}
                onRetry={
                  processingState.step === "error" ? handleRetry : undefined
                }
              />
            </div>

            {processingState.step === "error" && (
              <div className="alert alert-error mt-4 text-sm">
                <span>{processingState.error ?? "An error occurred. You can retry safely."}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Success ───────────────────────────────────────── */}
        {step === 4 && result && (
          <div>
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold mb-1">Bonfire Provisioned!</h2>
              <p className="text-sm text-base-content/60">
                Your Bonfire is live on Ethereum Mainnet and your Delve stack is
                ready.
              </p>
            </div>

            <div className="space-y-3 mb-5">
              <CredCard
                label="ERC-8004 Bonfire ID"
                value={String(result.erc8004BonfireId)}
                link={`https://8004scan.io/bonfire/${result.erc8004BonfireId}`}
              />
              <CredCard label="Bonfire ID" value={result.bonfireId} />
              <CredCard label="Agent ID" value={result.agentId} />
            </div>

            <div className="alert alert-success text-sm mb-6">
              <span>
                🔑 Your API key is available in your dashboard. Go to{" "}
                <strong>Dashboard → My Bonfires</strong> to reveal it (you&apos;ll be
                asked to sign a message).
              </span>
            </div>

            <div className="flex gap-3">
              <button
                className="btn btn-primary flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </button>
              <a
                href={`https://8004scan.io/bonfire/${result.erc8004BonfireId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                View on 8004scan.io ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
