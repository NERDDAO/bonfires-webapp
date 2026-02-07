/**
 * DataRoomsSection Component
 *
 * Displays My Data Rooms with two sub-sections:
 * - Created data rooms (by creator_wallet)
 * - Subscribed data rooms (by user_wallet)
 */
"use client";

import Link from "next/link";

import type { DataRoomInfo, DataRoomSubscription } from "@/types/api";
import type { DashboardSectionState } from "@/types/dashboard";

import { DashboardSection } from "./DashboardSection";

/**
 * DataRoomsSection Component
 *
 * Displays My Data Rooms with two sub-sections:
 * - Created data rooms (by creator_wallet)
 * - Subscribed data rooms (by user_wallet)
 */

interface DataRoomsSectionProps {
  createdDataRooms: DashboardSectionState<DataRoomInfo[]>;
  subscribedDataRooms: DashboardSectionState<DataRoomSubscription[]>;
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
 * Calculate days until expiration
 */
function daysUntilExpiration(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Created Data Room Card
 */
function CreatedDataRoomCard({ dataroom }: { dataroom: DataRoomInfo }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg hover:bg-base-100 transition-colors">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-success">
        🏠
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{dataroom.description}</p>
        <div className="flex items-center gap-3 text-xs text-base-content/60">
          <span>{formatCurrency(dataroom.price_usd)}</span>
          <span>{dataroom.query_limit} queries</span>
          <span
            className={`badge badge-xs ${
              dataroom.is_active ? "badge-success" : "badge-error"
            }`}
          >
            {dataroom.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/datarooms/${dataroom.id}`}
          className="btn btn-sm btn-ghost"
        >
          View
        </Link>
      </div>
    </div>
  );
}

/**
 * Subscribed Data Room Card
 */
function SubscribedDataRoomCard({
  subscription,
}: {
  subscription: DataRoomSubscription;
}) {
  const daysLeft = daysUntilExpiration(subscription.expires_at);
  const isExpiringSoon = daysLeft <= 3 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg hover:bg-base-100 transition-colors">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center text-info">
        🔑
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          Data Room {subscription.dataroom_id.slice(0, 8)}...
        </p>
        <div className="flex items-center gap-3 text-xs text-base-content/60">
          <span>{subscription.queries_remaining} queries left</span>
          <span
            className={`badge badge-xs ${
              isExpired
                ? "badge-error"
                : isExpiringSoon
                  ? "badge-warning"
                  : "badge-info"
            }`}
          >
            {isExpired
              ? "Expired"
              : isExpiringSoon
                ? `${daysLeft}d left`
                : `${daysLeft}d remaining`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/datarooms/${subscription.dataroom_id}`}
          className="btn btn-sm btn-primary btn-outline"
        >
          Access
        </Link>
        {(isExpired || isExpiringSoon) && (
          <Link
            href={`/datarooms/${subscription.dataroom_id}`}
            className="btn btn-sm btn-warning btn-outline"
          >
            Renew
          </Link>
        )}
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
        Connect your wallet to view your created and subscribed data rooms.
      </p>
    </div>
  );
}

export function DataRoomsSection({
  createdDataRooms,
  subscribedDataRooms,
  isWalletConnected,
}: DataRoomsSectionProps) {
  const created = createdDataRooms.data ?? [];
  const subscribed = subscribedDataRooms.data ?? [];

  const isLoading = createdDataRooms.isLoading || subscribedDataRooms.isLoading;
  const isError = createdDataRooms.isError || subscribedDataRooms.isError;
  const isEmpty =
    !isLoading && !isError && created.length === 0 && subscribed.length === 0;

  const handleRetry = () => {
    createdDataRooms.refetch();
    subscribedDataRooms.refetch();
  };

  return (
    <DashboardSection
      title="My Data Rooms"
      icon="🏠"
      isLoading={isWalletConnected && isLoading}
      isError={isWalletConnected && isError}
      errorMessage="Failed to load data rooms"
      onRetry={handleRetry}
      isEmpty={isWalletConnected && isEmpty}
      emptyMessage="No data rooms yet. Create one from the Graph Explorer!"
      skeletonRows={3}
      headerAction={
        <Link href="/datarooms" className="btn btn-sm btn-primary">
          Browse All
        </Link>
      }
    >
      {!isWalletConnected ? (
        <WalletPrompt />
      ) : (
        <div className="space-y-6">
          {/* Created Data Rooms */}
          {created.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-base-content/80 mb-3">
                Created by You ({created.length})
              </h3>
              <div className="space-y-2">
                {created.slice(0, 3).map((dataroom) => (
                  <CreatedDataRoomCard key={dataroom.id} dataroom={dataroom} />
                ))}
              </div>
              {created.length > 3 && (
                <Link
                  href="/datarooms?filter=created"
                  className="link text-base-content text-sm mt-2 inline-block"
                >
                  View all {created.length} created →
                </Link>
              )}
            </div>
          )}

          {/* Subscribed Data Rooms */}
          {subscribed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-base-content/80 mb-3">
                Subscribed ({subscribed.length})
              </h3>
              <div className="space-y-2">
                {subscribed.slice(0, 3).map((subscription) => (
                  <SubscribedDataRoomCard
                    key={subscription.id}
                    subscription={subscription}
                  />
                ))}
              </div>
              {subscribed.length > 3 && (
                <Link
                  href="/datarooms?filter=subscribed"
                  className="link text-base-content text-sm mt-2 inline-block"
                >
                  View all {subscribed.length} subscribed →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardSection>
  );
}
