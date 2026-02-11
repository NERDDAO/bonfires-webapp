"use client";

import { useState } from "react";

import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import type { DataRoomInfo } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import { usePaymentHeader } from "@/hooks/web3/usePaymentHeader";
import {
  isE2EWalletEnabled,
  setE2EWalletState,
  useWalletAccount,
} from "@/lib/wallet/e2e";

import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { formatErrorMessage } from "@/lib/utils";
import { hyperblogsCopy } from "@/content/hyperblogs";

type TxStep = "idle" | "signing" | "processing" | "redirecting";

const STEP_LABELS: Record<TxStep, string> = {
  idle: "",
  signing: "Signing transaction...",
  processing: "Processing payment...",
  redirecting: "Redirecting to your blog...",
};

interface PurchaseResponse {
  hyperblog: { id: string };
  payment: Record<string, unknown>;
}

export interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataroomId: string;
  /** Optional: dataroom title shown as a badge */
  dataroomTitle?: string;
  /** Optional: if not provided, price is fetched from GET /api/datarooms/{dataroomId} */
  dataroomPriceUsd?: number;
  /** Called with the new hyperblog ID on successful purchase */
  onSuccess?: (hyperblogId: string) => void;
}

/**
 * Modal form to create a hyperblog: description (user_query) and Create Blog button.
 * Fetches current price from DataRoom, builds/signs payment header, then POSTs to /api/hyperblogs/purchase.
 */
export function CreateBlogModal({
  isOpen,
  onClose,
  dataroomId,
  dataroomTitle,
  dataroomPriceUsd,
  onSuccess,
}: CreateBlogModalProps) {
  const { createTooltipContent, createTitle, createDescription, createDescriptionPlaceholder } = hyperblogsCopy;
  const [description, setDescription] = useState("");
  const [blogLength, setBlogLength] = useState<"short" | "medium" | "long">(
    "medium"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const { isConnected } = useWalletAccount();
  const { openConnectModal } = useConnectModal();
  const { buildAndSignPaymentHeader } = usePaymentHeader();

  function handleConnectWallet() {
    if (isE2EWalletEnabled()) {
      setE2EWalletState(true);
      return;
    }
    openConnectModal?.();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setTxStep("signing");

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

      // 2. Build and sign payment header for that amount
      const paymentHeader = await buildAndSignPaymentHeader(expectedAmount);
      if (!paymentHeader) {
        setError("Could not build payment. Please connect your wallet.");
        setIsSubmitting(false);
        setTxStep("idle");
        return;
      }

      // 3. POST /api/hyperblogs/purchase
      setTxStep("processing");
      const response = await apiClient.post<PurchaseResponse>(
        "/api/hyperblogs/purchase",
        {
          payment_header: paymentHeader,
          dataroom_id: dataroomId,
          user_query: description.trim(),
          is_public: true,
          blog_length: blogLength,
          generation_mode: "blog",
          expected_amount: expectedAmount,
        }
      );

      const hyperblogId = response.hyperblog.id;

      // 4. Brief redirect state so user sees confirmation
      setTxStep("redirecting");
      setDescription("");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      onSuccess?.(hyperblogId);
      onClose();
    } catch (err) {
      console.error("Purchase error:", err);
      setError(formatErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setTxStep("idle");
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      setError(null);
      setTxStep("idle");
      onClose();
    }
  }

  const showOverlay = isSubmitting && txStep !== "idle";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createTitle}
      description={createDescription}
      size="lg"
      showCloseButton={!isSubmitting}
      tooltipContent={createTooltipContent}
    >
      {/* Transaction status overlay */}
      {showOverlay && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-brand-black/90 backdrop-blur-sm">
          <Image
            src="/icons/loader-circle.svg"
            height={32}
            width={32}
            alt=""
            className="animate-spin"
          />
          <p className="text-sm font-medium text-dark-s-100">
            {STEP_LABELS[txStep]}
          </p>
          {txStep === "signing" && (
            <p className="text-xs text-dark-s-500 max-w-60 text-center">
              Please confirm in your wallet
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mt-2">
        {dataroomTitle != null && dataroomTitle !== "" && (
          <Badge variant="filled">Topic: {dataroomTitle}</Badge>
        )}
        <Badge variant="outline">Cost: ${dataroomPriceUsd ?? 0}</Badge>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col mt-3">
        <label
          htmlFor="create-blog-description"
          className="text-xs font-medium text-dark-s-100 -mb-2 ml-4 bg-brand-black w-fit z-10"
        >
          Description
        </label>
        <textarea
          id="create-blog-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={createDescriptionPlaceholder}
          maxLength={600}
          rows={6}
          className={cn(
            "w-full rounded-lg border border-dark-s-700 bg-[#FFFFFF05] px-3 py-4",
            "text-dark-s-0 placeholder:text-dark-s-500",
            "resize-none",
            "focus:outline-none focus:ring-2 focus:ring-dark-s-500 focus:border-transparent"
          )}
          disabled={isSubmitting}
        />

        <h2
          id="modal-title"
          className="font-semibold text-lg text-dark-s-0 mt-4"
        >
          Blog Length
        </h2>

        {/* blog length options — tab-style like graph explorer select-panel */}
        <div
          className="mt-4 flex rounded-xl border border-[#333333] bg-[#181818] p-1"
          role="group"
          aria-label="Blog length"
        >
          {(
            [
              { value: "short" as const, label: ["Short", "(2 min)"] },
              { value: "medium" as const, label: ["Medium", "(5 min)"] },
              { value: "long" as const, label: ["Long", "(10 min)"] },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setBlogLength(value)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                blogLength === value
                  ? "bg-[#22252B] text-white"
                  : "text-[#667085] hover:text-white/90"
              )}
              aria-pressed={blogLength === value}
              disabled={isSubmitting}
            >
              {label[0]} 
              <span className="hidden lg:inline">&nbsp;</span>
              <br className="block lg:hidden" />
              {label[1]}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-5">
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
          {!isConnected ? (
            <Button
              type="button"
              variant="primary"
              showElevation={false}
              onClick={handleConnectWallet}
              className="flex-1"
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              showElevation={false}
              disabled={isSubmitting || !description.trim()}
              className="flex-1"
            >
              {isSubmitting ? "Creating..." : "Create Blog"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
