"use client";

import { useState } from "react";

import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/client";
import { usePaymentHeader } from "@/hooks/web3/usePaymentHeader";

interface SelfReviewButtonProps {
  bonfireId: string;
}

/** 1 USDC = 1_000_000 (6 decimals) */
const SELF_REVIEW_AMOUNT = "1000000";

export function SelfReviewButton({ bonfireId }: SelfReviewButtonProps) {
  const { buildAndSignPaymentHeader, isLoading: isSigningPayment } =
    usePaymentHeader();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReview = async () => {
    setIsSubmitting(true);
    try {
      const paymentHeader = await buildAndSignPaymentHeader(SELF_REVIEW_AMOUNT);
      if (!paymentHeader) {
        toast.error("Payment signing was cancelled.");
        return;
      }

      await apiClient.post("/api/applicant-reviews/self", {
        bonfire_id: bonfireId,
        payment_header: paymentHeader,
      });

      toast.success("Self-review request submitted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit self-review request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSigningPayment || isSubmitting;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Request a Review</h2>
      <p className="text-sm text-base-content/60 mb-6 max-w-md mx-auto">
        Submit yourself for an applicant review for this bonfire. A $1 USDC
        payment is required to cover evaluation costs.
      </p>
      <button
        className="btn btn-primary"
        onClick={handleRequestReview}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Request Review ($1)"}
      </button>
    </div>
  );
}
