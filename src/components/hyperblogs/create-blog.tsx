"use client";

import { useState } from "react";

import type { DataRoomInfo } from "@/types";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import { usePaymentHeader } from "@/hooks/web3/usePaymentHeader";

import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/cn";

export interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataroomId: string;
  /** Optional: if not provided, price is fetched from GET /api/datarooms/{dataroomId} */
  dataroomPriceUsd?: number;
  onSuccess?: () => void;
}

/**
 * Modal form to create a hyperblog: description (user_query) and Create Blog button.
 * Fetches current price from DataRoom, builds/signs payment header, then POSTs to /api/hyperblogs/purchase.
 */
export function CreateBlogModal({
  isOpen,
  onClose,
  dataroomId,
  dataroomPriceUsd,
  onSuccess,
}: CreateBlogModalProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { buildAndSignPaymentHeader } = usePaymentHeader();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Fetch current price for this DataRoom (current_hyperblog_price_usd or price_usd)
      let priceUsd = dataroomPriceUsd;
      if (priceUsd == null) {
        const dataroom = await apiClient.get<DataRoomInfo>(
          `/api/datarooms/${dataroomId}`
        );
        const info = dataroom as DataRoomInfo & {
          current_hyperblog_price_usd?: number;
        };
        priceUsd = info.current_hyperblog_price_usd ?? info.price_usd ?? 0;
      }

      const expectedAmount = priceUsd.toFixed(2);

      console.log("expectedAmount", expectedAmount);

      // 2. Build and sign payment header for that amount
      const paymentHeader = await buildAndSignPaymentHeader(expectedAmount);
      if (!paymentHeader) {
        setError("Could not build payment. Please connect your wallet.");
        setIsSubmitting(false);
        return;
      }

      // 3. POST /api/hyperblogs/purchase
      await apiClient.post("/api/hyperblogs/purchase", {
        payment_header: paymentHeader,
        dataroom_id: dataroomId,
        user_query: description.trim(),
        is_public: true,
        blog_length: "medium",
        generation_mode: "blog",
        expected_amount: expectedAmount,
      });

      setDescription("");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create blog. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Blog"
      description="Generate an AI-powered blog post from this dataroom’s knowledge graph"
      size="lg"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <label
          htmlFor="create-blog-description"
          className="text-sm font-medium text-dark-s-100"
        >
          Description
        </label>
        <textarea
          id="create-blog-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you want the blog to cover (Max 600 characters)"
          maxLength={600}
          rows={4}
          className={cn(
            "w-full rounded-lg border border-dark-s-700 bg-[#FFFFFF05] px-3 py-2",
            "text-dark-s-0 placeholder:text-dark-s-500",
            "focus:outline-none focus:ring-2 focus:ring-dark-s-500 focus:border-transparent"
          )}
          disabled={isSubmitting}
        />
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            showElevation={false}
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            showElevation={false}
            disabled={isSubmitting || !description.trim()}
            className="flex-1"
          >
            {isSubmitting ? "Creating…" : "Create Blog"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
