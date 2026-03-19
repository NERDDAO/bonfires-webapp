"use client";

import { useState } from "react";

import { ApplicantReviewsSection } from "@/components/dashboard/ApplicantReviewsSection";

export default function ApplicantReviewsPage() {
  const [bonfireId, setBonfireId] = useState("");

  return (
    <div className="space-y-6">
      <div className="bf-review-panel" style={{ padding: "24px 36px" }}>
        <div className="bf-section-label">CONFIG</div>
        <div className="bf-grid-2">
          <div>
            <span className="bf-label">Bonfire ID</span>
            <input
              className="bf-input"
              value={bonfireId}
              onChange={(event) => setBonfireId(event.target.value)}
              placeholder="Mongo ObjectId bonfire identifier"
            />
          </div>
        </div>
      </div>

      {bonfireId && (
        <ApplicantReviewsSection
          bonfireId={bonfireId}
          showAgentIdInput
        />
      )}
    </div>
  );
}
