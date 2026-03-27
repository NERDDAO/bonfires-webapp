"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Modal } from "@/components/ui/modal";
import { useBonfiresQuery } from "@/hooks";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { BonfireInfo, HackathonTrackInfo } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RubricInfo {
  id: string;
  name: string;
  description?: string;
  version?: string | number;
  is_active?: boolean;
  categories?: Array<{ name: string; display_name: string; weight: number }>;
}

/* ------------------------------------------------------------------ */
/*  Contract constants                                                 */
/* ------------------------------------------------------------------ */

const FACTORY_ADDRESS = "0xb4081b1dd431699A3FA9f607a734A3939F05A827" as `0x${string}`;

const FACTORY_ABI = [
  {
    name: "createEscrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "feeBps", type: "uint16" },
    ],
    outputs: [{ name: "escrow", type: "address" }],
  },
] as const;

const USDC_BY_CHAIN: Record<number, `0x${string}`> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // base
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // base-sepolia
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const INPUT_CLS =
  "w-full px-3 py-2.5 bg-[#FFFFFF08] border border-[#333333] text-sm text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 rounded-lg";

const CADENCE_OPTIONS: Array<{ value: "weekly" | "monthly" | "yearly"; label: string }> = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

type Step = "bonfire" | "rubric" | "config" | "deploy";

const STEPS: Array<{ key: Step; label: string; number: number }> = [
  { key: "bonfire", label: "Bonfire", number: 1 },
  { key: "rubric", label: "Rubric", number: 2 },
  { key: "config", label: "Configure", number: 3 },
  { key: "deploy", label: "Deploy", number: 4 },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            {idx > 0 && (
              <span
                className={cn(
                  "w-6 h-px mx-1",
                  isDone ? "bg-brand-primary" : "bg-[#333333]",
                )}
              />
            )}
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
                isActive && "bg-brand-primary/20 text-brand-primary",
                isDone && "bg-brand-primary/10 text-brand-primary/70",
                !isActive && !isDone && "text-dark-s-80",
              )}
            >
              {step.number}. {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CreateTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (track: HackathonTrackInfo) => void;
}

export default function CreateTrackModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTrackModalProps) {
  /* Wizard state */
  const [step, setStep] = useState<Step>("bonfire");
  const [selectedBonfire, setSelectedBonfire] = useState<BonfireInfo | null>(null);
  const [selectedRubric, setSelectedRubric] = useState<RubricInfo | null>(null);
  const [rubrics, setRubrics] = useState<RubricInfo[]>([]);
  const [rubricLoading, setRubricLoading] = useState(false);

  /* Config state */
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [basePrice, setBasePrice] = useState("0.50");
  const [priceStep, setPriceStep] = useState("0.25");
  const [decayRate, setDecayRate] = useState("0.10");
  const [feeBps, setFeeBps] = useState("500");
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* Deploy state */
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTrack, setCreatedTrack] = useState<HackathonTrackInfo | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  /* Queries / wagmi */
  const { data: bonfiresData } = useBonfiresQuery();
  const { address, isConnected, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash });

  const bonfires = bonfiresData?.bonfires ?? [];
  const usdcAddress = chain?.id ? USDC_BY_CHAIN[chain.id] : undefined;

  /* ---------------------------------------------------------------- */
  /*  Step handlers                                                    */
  /* ---------------------------------------------------------------- */

  const fetchRubrics = useCallback(async (bonfireId: string) => {
    setRubricLoading(true);
    setRubrics([]);
    try {
      const data = await apiClient.get<{ items: RubricInfo[] } | RubricInfo[]>(
        `/api/hackathon/rubrics?bonfire_id=${bonfireId}`,
        { cache: false },
      );
      // Backend returns {items: [...]} wrapper
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      setRubrics(items);
    } catch {
      setRubrics([]);
    } finally {
      setRubricLoading(false);
    }
  }, []);

  const handleSelectBonfire = useCallback(
    (bonfire: BonfireInfo) => {
      setSelectedBonfire(bonfire);
      setStep("rubric");
      fetchRubrics(bonfire.id);
    },
    [fetchRubrics],
  );

  const handleSelectRubric = useCallback((rubric: RubricInfo) => {
    setSelectedRubric(rubric);
    setName(`${rubric.name} \u2014 weekly`);
    setStep("config");
  }, []);

  /* Update suggested name when cadence changes */
  useEffect(() => {
    if (selectedRubric) {
      setName(`${selectedRubric.name} \u2014 ${cadence}`);
    }
  }, [cadence, selectedRubric]);

  /* Handle tx receipt -> create track via API */
  useEffect(() => {
    if (!txReceipt || !deploying) return;

    const escrowAddress =
      txReceipt.logs[0]?.topics[1]
        ? (`0x${txReceipt.logs[0].topics[1].slice(26)}` as `0x${string}`)
        : null;

    if (!escrowAddress) {
      setError("Could not parse escrow address from transaction receipt.");
      setDeploying(false);
      return;
    }

    (async () => {
      try {
        const track = await apiClient.post<HackathonTrackInfo>(
          "/api/hackathon/tracks",
          {
            name,
            cadence,
            rubric_id: selectedRubric?.id,
            bonfire_ref: selectedBonfire?.id,
            escrow_address: escrowAddress,
            starts_at: startsAt || undefined,
            ends_at: endsAt || undefined,
            base_price: parseFloat(basePrice),
            price_step: parseFloat(priceStep),
            decay_rate: parseFloat(decayRate),
            platform_fee_bps: parseInt(feeBps, 10),
          },
        );
        setCreatedTrack(track);
        onCreated?.(track);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create track via API.";
        setError(msg);
      } finally {
        setDeploying(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txReceipt]);

  const handleDeploy = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!usdcAddress) {
      setError("Unsupported network. Please switch to Base or Base Sepolia.");
      return;
    }

    setError(null);
    setDeploying(true);

    try {
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createEscrow",
        args: [usdcAddress, parseInt(feeBps, 10)],
      });
      setTxHash(hash);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed.";
      setError(msg);
      setDeploying(false);
    }
  }, [isConnected, address, usdcAddress, feeBps, writeContractAsync]);

  /* Reset on close */
  const handleClose = useCallback(() => {
    setStep("bonfire");
    setSelectedBonfire(null);
    setSelectedRubric(null);
    setRubrics([]);
    setName("");
    setCadence("weekly");
    setStartsAt("");
    setEndsAt("");
    setBasePrice("0.50");
    setPriceStep("0.25");
    setDecayRate("0.10");
    setFeeBps("500");
    setShowAdvanced(false);
    setError(null);
    setCreatedTrack(null);
    setDeploying(false);
    setTxHash(undefined);
    onClose();
  }, [onClose]);

  /* ---------------------------------------------------------------- */
  /*  Step renderers                                                   */
  /* ---------------------------------------------------------------- */

  function renderBonfireStep() {
    return (
      <div className="space-y-3 mt-2">
        <p className="text-sm text-dark-s-60 mb-4">
          Choose the Bonfire this track will belong to.
        </p>
        {bonfires.length === 0 && (
          <p className="text-sm text-dark-s-80">No bonfires found.</p>
        )}
        {bonfires.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handleSelectBonfire(b)}
            className={cn(
              "w-full text-left rounded-xl p-4 border transition-colors",
              "bg-[#FFFFFF05] border-[#333333] hover:bg-[#FFFFFF08] hover:border-brand-primary/40",
            )}
          >
            <span className="text-sm font-semibold text-dark-s-0">{b.name}</span>
            {b.description && (
              <span className="block text-xs text-dark-s-60 mt-1 line-clamp-2">
                {b.description}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  function renderRubricStep() {
    return (
      <div className="space-y-3 mt-2">
        <p className="text-sm text-dark-s-60 mb-4">
          Select the rubric that will be used for judging submissions.
        </p>

        {rubricLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[#FFFFFF05] border border-[#333333] animate-pulse"
              />
            ))}
          </div>
        )}

        {!rubricLoading && rubrics.length === 0 && (
          <p className="text-sm text-dark-s-80">
            No rubrics found for this bonfire.
          </p>
        )}

        {!rubricLoading &&
          rubrics.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRubric(r)}
              className={cn(
                "w-full text-left rounded-xl p-4 border transition-colors",
                "bg-[#FFFFFF05] border-[#333333] hover:bg-[#FFFFFF08] hover:border-brand-primary/40",
              )}
            >
              <span className="text-sm font-semibold text-dark-s-0">{r.name}</span>
              {r.description && (
                <span className="block text-xs text-dark-s-60 mt-1 line-clamp-2">
                  {r.description}
                </span>
              )}
              <span className="block text-xs text-dark-s-80 mt-2">
                {r.categories?.length ?? 0} categor{(r.categories?.length ?? 0) === 1 ? "y" : "ies"}{r.version ? ` · v${r.version}` : ""}
              </span>
            </button>
          ))}

        <button
          type="button"
          onClick={() => setStep("bonfire")}
          className="text-xs text-dark-s-60 hover:text-dark-s-0 transition-colors mt-2"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  function renderConfigStep() {
    const canProceed = name.trim().length > 0;

    return (
      <div className="space-y-4 mt-2">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
            Track name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekly AI Art Challenge"
            className={INPUT_CLS}
          />
        </div>

        {/* Cadence */}
        <div>
          <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
            Cadence
          </label>
          <div className="flex gap-2">
            {CADENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCadence(opt.value)}
                className={cn(
                  "flex-1 py-2 text-sm rounded-lg border font-medium transition-colors",
                  cadence === opt.value
                    ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary"
                    : "bg-[#FFFFFF05] border-[#333333] text-dark-s-60 hover:text-dark-s-0",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
              Starts at
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
              Ends at
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Advanced pricing toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-dark-s-60 hover:text-dark-s-0 transition-colors flex items-center gap-1"
        >
          <span
            className={cn(
              "inline-block transition-transform",
              showAdvanced && "rotate-90",
            )}
          >
            &#9654;
          </span>
          Advanced pricing
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3 pl-3 border-l border-[#333333]">
            <div>
              <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
                Base price (USD)
              </label>
              <input
                type="text"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
                Price step (USD)
              </label>
              <input
                type="text"
                value={priceStep}
                onChange={(e) => setPriceStep(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
                Decay rate
              </label>
              <input
                type="text"
                value={decayRate}
                onChange={(e) => setDecayRate(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-s-60 mb-1.5">
                Fee (bps)
              </label>
              <input
                type="text"
                value={feeBps}
                onChange={(e) => setFeeBps(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep("rubric")}
            className="text-xs text-dark-s-60 hover:text-dark-s-0 transition-colors"
          >
            &larr; Back
          </button>
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => setStep("deploy")}
            className={cn(
              "px-5 py-2 text-sm rounded-lg font-semibold transition-colors",
              canProceed
                ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                : "bg-[#FFFFFF10] text-dark-s-80 cursor-not-allowed",
            )}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  function renderDeployStep() {
    /* Success state */
    if (createdTrack) {
      return (
        <div className="mt-2 space-y-4 text-center">
          <div className="text-3xl">&#9989;</div>
          <p className="text-sm font-semibold text-dark-s-0">
            Track created successfully!
          </p>
          <a
            href={`/hackathon/${createdTrack.id}`}
            className="inline-block text-sm text-brand-primary hover:underline"
          >
            View track &rarr;
          </a>
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-4">
        <p className="text-sm text-dark-s-60 mb-2">
          Review the details below, then deploy the escrow contract and create the track.
        </p>

        {/* Summary */}
        <div className="rounded-xl bg-[#FFFFFF05] border border-[#333333] p-4 space-y-2 text-sm">
          <Row label="Bonfire" value={selectedBonfire?.name ?? ""} />
          <Row label="Rubric" value={selectedRubric?.name ?? ""} />
          <Row label="Track name" value={name} />
          <Row label="Cadence" value={cadence} />
          {startsAt && <Row label="Starts" value={new Date(startsAt).toLocaleString()} />}
          {endsAt && <Row label="Ends" value={new Date(endsAt).toLocaleString()} />}
          <Row label="Fee" value={`${feeBps} bps (${(parseInt(feeBps, 10) / 100).toFixed(1)}%)`} />
        </div>

        {/* Deploy or use existing */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={deploying || !isConnected}
            onClick={handleDeploy}
            className={cn(
              "w-full py-3 text-sm rounded-lg font-semibold transition-colors",
              deploying || !isConnected
                ? "bg-[#FFFFFF10] text-dark-s-80 cursor-not-allowed"
                : "bg-brand-primary text-white hover:bg-brand-primary/90",
            )}
          >
            {!isConnected
              ? "Connect wallet to deploy"
              : deploying
                ? "Deploying..."
                : "Deploy Escrow & Create Track"}
          </button>

          {error && (
          <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#333333]" />
            <span className="text-xs text-dark-s-80">or use existing escrow</span>
            <div className="flex-1 h-px bg-[#333333]" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0x... escrow address"
              id="existing-escrow"
              className="flex-1 px-3 py-2 rounded-lg bg-[#FFFFFF08] border border-[#333333] text-xs text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 font-mono"
            />
            <button
              type="button"
              disabled={deploying}
              onClick={async () => {
                const input = document.getElementById("existing-escrow") as HTMLInputElement;
                const addr = input?.value?.trim();
                if (!addr?.startsWith("0x") || addr.length !== 42) {
                  setError("Invalid address");
                  return;
                }
                setDeploying(true);
                setError(null);
                try {
                  const body = {
                    name,
                    cadence,
                    rubric_id: selectedRubric?.id,
                    bonfire_ref: selectedBonfire?.id,
                    escrow_address: addr,
                    starts_at: startsAt || new Date().toISOString(),
                    ends_at: endsAt || new Date(Date.now() + 7 * 86400000).toISOString(),
                    base_price_usd: parseFloat(basePrice),
                    price_step_usd: parseFloat(priceStep),
                    price_decay_rate: parseFloat(decayRate),
                    platform_fee_bps: parseInt(feeBps, 10),
                  };
                  const track = await apiClient.post<HackathonTrackInfo>("/api/hackathon/tracks", body);
                  setCreatedTrack(track);
                  onCreated?.(track);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to create track");
                } finally {
                  setDeploying(false);
                }
              }}
              className="px-4 py-2 rounded-lg bg-[#FFFFFF08] border border-[#333333] text-xs text-dark-s-60 hover:border-brand-primary/50 hover:text-dark-s-0 transition-colors"
            >
              Create Track
            </button>
          </div>
          </>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}

        {/* Back */}
        {!deploying && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("config");
            }}
            className="text-xs text-dark-s-60 hover:text-dark-s-0 transition-colors"
          >
            &larr; Back
          </button>
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Hackathon Track"
      size="lg"
      closeOnBackdrop={!deploying}
      closeOnEscape={!deploying}
    >
      <StepIndicator current={step} />

      {step === "bonfire" && renderBonfireStep()}
      {step === "rubric" && renderRubricStep()}
      {step === "config" && renderConfigStep()}
      {step === "deploy" && renderDeployStep()}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-dark-s-60">{label}</span>
      <span className="text-dark-s-0 font-medium">{value}</span>
    </div>
  );
}
