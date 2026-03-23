"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { apiClient } from "@/lib/api/client";
import { useAgentsQuery } from "@/hooks/queries/useAgentsQuery";
import {
  useRubricListQuery,
  useStructuredRubricQuery,
} from "@/hooks/queries/useRubricQuery";
import type { ApplicantReviewBatchImportResponse } from "@/types/applicant-reviews";

interface BatchCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonfireId: string;
  onBatchCreated: (batchId: string) => void;
}

type ImportMode = "tsv" | "json";

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function BatchCreationModal({
  isOpen,
  onClose,
  bonfireId,
  onBatchCreated,
}: BatchCreationModalProps) {
  const [batchName, setBatchName] = useState(`Applicant Batch ${todayString()}`);
  const [agentId, setAgentId] = useState<string>("");
  const [selectedRubricDocId, setSelectedRubricDocId] = useState<string | null>(
    null,
  );
  const [importMode, setImportMode] = useState<ImportMode>("tsv");
  const [dataText, setDataText] = useState("");
  const [columnMap, setColumnMap] = useState("");
  const [isColumnMapOpen, setIsColumnMapOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const agentsQuery = useAgentsQuery({ bonfireId });
  const rubricListQuery = useRubricListQuery(bonfireId);
  const structuredRubricQuery = useStructuredRubricQuery(
    selectedRubricDocId,
    bonfireId,
  );

  // Auto-select first active agent on load
  useEffect(() => {
    if (agentsQuery.data?.agents && !agentId) {
      const firstActive = agentsQuery.data.agents.find((a) => a.is_active);
      if (firstActive) {
        setAgentId(firstActive.id);
      }
    }
  }, [agentsQuery.data, agentId]);

  // Auto-select active rubric on load
  useEffect(() => {
    if (rubricListQuery.data?.items && selectedRubricDocId === null) {
      const activeRubric = rubricListQuery.data.items.find((r) => r.is_active);
      if (activeRubric) {
        setSelectedRubricDocId(activeRubric.id);
      }
    }
  }, [rubricListQuery.data, selectedRubricDocId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBatchName(`Applicant Batch ${todayString()}`);
      setAgentId("");
      setSelectedRubricDocId(null);
      setImportMode("tsv");
      setDataText("");
      setColumnMap("");
      setIsColumnMapOpen(false);
    }
  }, [isOpen]);

  async function handleSubmit() {
    if (!bonfireId) {
      toast.error("Bonfire ID is required");
      return;
    }
    if (!agentId) {
      toast.error("Please select an agent");
      return;
    }
    if (!dataText.trim()) {
      toast.error(
        importMode === "tsv"
          ? "Please paste TSV data"
          : "Please paste JSON data",
      );
      return;
    }

    setIsImporting(true);
    try {
      const resolvedRubricId = structuredRubricQuery.data?.id;

      const basePayload = {
        bonfire_id: bonfireId,
        agent_id: agentId,
        rubric_id: resolvedRubricId ?? undefined,
        batch_name: batchName,
        source_name: importMode === "tsv" ? "manual-paste" : "json-import",
      };

      let payload: Record<string, unknown>;

      if (importMode === "tsv") {
        payload = { ...basePayload, table_text: dataText };
      } else {
        const rows = JSON.parse(dataText) as Record<string, unknown>[];
        const parsedColumnMap = columnMap.trim()
          ? (JSON.parse(columnMap) as Record<string, string>)
          : undefined;
        payload = { ...basePayload, rows, column_map: parsedColumnMap };
      }

      const response =
        await apiClient.post<ApplicantReviewBatchImportResponse>(
          "/api/applicant-review-batches/import",
          payload,
        );

      toast.success(`Imported ${response.imported_count} applicants`);
      onBatchCreated(response.batch_id);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to import batch";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Applicant Batch" size="lg">
      {/* Batch Name */}
      <div style={{ marginBottom: 16 }}>
        <span className="bf-label">Batch Name</span>
        <input
          type="text"
          className="bf-input"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
        />
      </div>

      {/* Agent */}
      <div style={{ marginBottom: 16 }}>
        <span className="bf-label">Agent</span>
        <select
          className="bf-input"
          style={{ padding: "8px 12px" }}
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        >
          <option value="">Select an agent...</option>
          {agentsQuery.data?.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
              {agent.is_active ? " [active]" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Rubric */}
      <div style={{ marginBottom: 16 }}>
        <span className="bf-label">Rubric</span>
        <select
          className="bf-input"
          style={{ padding: "8px 12px" }}
          value={selectedRubricDocId ?? ""}
          onChange={(e) =>
            setSelectedRubricDocId(e.target.value || null)
          }
        >
          <option value="">
            Default (v{rubricListQuery.data?.default_rubric_version ?? "1"})
          </option>
          {rubricListQuery.data?.items.map((rubric) => (
            <option key={rubric.id} value={rubric.id}>
              {rubric.name}
              {rubric.version ? ` v${rubric.version}` : ""}
              {rubric.is_active ? " [active]" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Import Mode Toggle */}
      <div style={{ marginBottom: 16 }}>
        <span className="bf-label">Import Mode</span>
        <div className="bf-mode-toggle">
          <button
            type="button"
            className={importMode === "tsv" ? "active" : ""}
            onClick={() => setImportMode("tsv")}
          >
            TSV
          </button>
          <button
            type="button"
            className={importMode === "json" ? "active" : ""}
            onClick={() => setImportMode("json")}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Data Input */}
      <div style={{ marginBottom: 16 }}>
        <span className="bf-label">Data</span>
        {importMode === "tsv" ? (
          <textarea
            className="bf-textarea"
            rows={8}
            placeholder="Paste TSV copied from Excel or Google Sheets"
            value={dataText}
            onChange={(e) => setDataText(e.target.value)}
          />
        ) : (
          <>
            <textarea
              className="bf-textarea"
              rows={8}
              placeholder={'Paste a JSON array of objects, e.g.\n[\n  { "name": "Alice", "address": "0x..." },\n  { "name": "Bob", "address": "0x..." }\n]'}
              value={dataText}
              onChange={(e) => setDataText(e.target.value)}
            />
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--bf-text-muted, #A9A9A9)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: 0,
                }}
                onClick={() => setIsColumnMapOpen(!isColumnMapOpen)}
              >
                {isColumnMapOpen ? "\u25BC" : "\u25B6"} Column Mapping
                (optional)
              </button>
              {isColumnMapOpen && (
                <textarea
                  className="bf-textarea"
                  rows={4}
                  style={{ marginTop: 8 }}
                  placeholder={'{\n  "Full Name": "full_name",\n  "ETH Address": "ethereum_address"\n}'}
                  value={columnMap}
                  onChange={(e) => setColumnMap(e.target.value)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button
          type="button"
          className="bf-btn-secondary"
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="bf-btn-primary"
          onClick={handleSubmit}
          disabled={isImporting || (selectedRubricDocId !== null && structuredRubricQuery.isLoading)}
        >
          {isImporting ? "Importing..." : "Import Batch"}
        </button>
      </div>
    </Modal>
  );
}
