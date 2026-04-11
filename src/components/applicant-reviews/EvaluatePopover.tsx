"use client";

import { useState } from "react";

import type { EvalRunSummary } from "@/hooks/queries/useEvalRunsForBatch";

interface EvaluatePopoverProps {
  batchId: string;
  runs: EvalRunSummary[];
  isLoading: boolean;
  isEvaluating: boolean;
  onStart: (opts: { rescoreOnly: boolean; reviewBonfireId?: string }) => void;
  onClose: () => void;
}

export function EvaluatePopover({
  batchId,
  runs,
  isLoading,
  isEvaluating,
  onStart,
  onClose,
}: EvaluatePopoverProps) {
  const [mode, setMode] = useState<"full" | "rescore">("full");
  const [selectedRunId, setSelectedRunId] = useState<string>("");

  const rescorableRuns = runs.filter((r) => r.review_bonfire_id);

  const handleStart = () => {
    if (mode === "full") {
      onStart({ rescoreOnly: false });
    } else {
      const run = rescorableRuns.find((r) => r.run_id === selectedRunId);
      if (run?.review_bonfire_id) {
        onStart({ rescoreOnly: true, reviewBonfireId: run.review_bonfire_id });
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatStatus = (run: EvalRunSummary) => {
    if (run.status === "completed") return "completed";
    if (run.status === "failed") return "failed";
    return run.graph_phase ?? run.status;
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 4,
        background: "var(--bf-bg-elevated, #1a1a2e)",
        border: "1px solid var(--bf-border, #333)",
        borderRadius: 8,
        padding: 16,
        width: 320,
        zIndex: 50,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Evaluate Batch</div>

      {/* Mode selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="radio"
            name="evalMode"
            checked={mode === "full"}
            onChange={() => setMode("full")}
          />
          <div>
            <div style={{ fontWeight: 500 }}>Full Run</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Research + KG + Score</div>
          </div>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="radio"
            name="evalMode"
            checked={mode === "rescore"}
            onChange={() => setMode("rescore")}
            disabled={rescorableRuns.length === 0}
          />
          <div>
            <div style={{ fontWeight: 500, opacity: rescorableRuns.length === 0 ? 0.4 : 1 }}>
              Rescore Only
            </div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Use existing review bonfire</div>
          </div>
        </label>
      </div>

      {/* Run picker dropdown (rescore mode) */}
      {mode === "rescore" && (
        <select
          value={selectedRunId}
          onChange={(e) => setSelectedRunId(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            marginBottom: 12,
            background: "var(--bf-bg, #0f0f23)",
            color: "inherit",
            border: "1px solid var(--bf-border, #333)",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          <option value="">Select a previous run...</option>
          {rescorableRuns.map((run) => (
            <option key={run.run_id} value={run.run_id}>
              {formatDate(run.created_at)} — {formatStatus(run)} ({run.completed_count}/{run.total_count})
            </option>
          ))}
        </select>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="bf-btn-secondary"
          style={{ fontSize: 12, padding: "6px 14px" }}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="bf-btn-primary"
          style={{ fontSize: 12, padding: "6px 14px" }}
          onClick={handleStart}
          disabled={
            isEvaluating ||
            isLoading ||
            (mode === "rescore" && !selectedRunId)
          }
        >
          {isEvaluating ? "Running..." : "Start"}
        </button>
      </div>
    </div>
  );
}
