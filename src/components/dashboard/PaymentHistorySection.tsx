/**
 * PaymentHistorySection Component
 *
 * Displays recent payment transactions for the connected wallet.
 * Shows transaction type, amount, status, and link to transaction.
 */
"use client";

import type { DashboardSectionState } from "@/types/dashboard";
import type { PaymentTransaction, PaymentType } from "@/types/web3";

import { DashboardSection } from "./DashboardSection";

/**
 * PaymentHistorySection Component
 *
 * Displays recent payment transactions for the connected wallet.
 * Shows transaction type, amount, status, and link to transaction.
 */

interface PaymentHistorySectionProps {
  data: DashboardSectionState<PaymentTransaction[]>;
  isWalletConnected: boolean;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get icon and label for payment type
 */
function getPaymentTypeInfo(type: PaymentType): {
  icon: string;
  label: string;
} {
  switch (type) {
    case "chat":
      return { icon: "💬", label: "Chat Message" };
    case "delve":
      return { icon: "🔍", label: "Graph Search" };
    case "dataroom":
      return { icon: "🏠", label: "Data Room" };
    case "hyperblog":
      return { icon: "📝", label: "HyperBlog" };
    default:
      return { icon: "💰", label: type };
  }
}

/**
 * Get status badge styling
 */
function getStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case "confirmed":
      return { className: "badge-success", label: "Confirmed" };
    case "pending":
      return { className: "badge-warning", label: "Pending" };
    case "failed":
      return { className: "badge-error", label: "Failed" };
    default:
      return { className: "badge-ghost", label: status };
  }
}

/**
 * Truncate transaction hash for display
 */
function truncateTxHash(hash: string): string {
  if (hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

/**
 * Payment Transaction Row
 */
function PaymentRow({ transaction }: { transaction: PaymentTransaction }) {
  const typeInfo = getPaymentTypeInfo(transaction.type);
  const statusBadge = getStatusBadge(transaction.status);

  return (
    <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg">
      {/* Type icon */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-xl">{typeInfo.icon}</span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{typeInfo.label}</span>
          <span className={`badge badge-xs ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-base-content/60">
          <span>{formatDate(transaction.created_at)}</span>
          {transaction.tx_hash && (
            <a
              href={`https://explorer.testnet.abs.xyz/tx/${transaction.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link text-base-content"
            >
              {truncateTxHash(transaction.tx_hash)}
            </a>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <span className="font-semibold text-error">
          -{formatCurrency(transaction.amount_usd)}
        </span>
      </div>
    </div>
  );
}

/**
 * Wallet connection prompt
 */
function WalletPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-4xl mb-3">🔗</div>
      <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-sm text-base-content/70 mb-4 max-w-xs">
        Connect your wallet to view your payment history.
      </p>
    </div>
  );
}

/**
 * Calculate total spent
 */
function calculateTotalSpent(transactions: PaymentTransaction[]): number {
  return transactions
    .filter((t) => t.status === "confirmed")
    .reduce((total, t) => total + t.amount_usd, 0);
}

export function PaymentHistorySection({
  data,
  isWalletConnected,
}: PaymentHistorySectionProps) {
  const transactions = data.data ?? [];
  const isEmpty = !data.isLoading && !data.isError && transactions.length === 0;
  const totalSpent = calculateTotalSpent(transactions);

  return (
    <DashboardSection
      title="Payment History"
      icon="💳"
      isLoading={isWalletConnected && data.isLoading}
      isError={isWalletConnected && data.isError}
      errorMessage={data.error?.message ?? "Failed to load payment history"}
      onRetry={data.refetch}
      isEmpty={isWalletConnected && isEmpty}
      emptyMessage="No payments yet. Start exploring Web3 features!"
      skeletonRows={4}
    >
      {!isWalletConnected ? (
        <WalletPrompt />
      ) : (
        <div className="space-y-4">
          {/* Total spent summary */}
          {transactions.length > 0 && (
            <div className="bg-base-100 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-base-content/70">Total Spent</span>
              <span className="font-bold text-lg">
                {formatCurrency(totalSpent)}
              </span>
            </div>
          )}

          {/* Transaction list */}
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction) => (
              <PaymentRow key={transaction.id} transaction={transaction} />
            ))}
          </div>

          {transactions.length > 5 && (
            <div className="text-center">
              <button className="link text-base-content text-sm">
                View all {transactions.length} transactions →
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardSection>
  );
}
