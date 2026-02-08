/**
 * Dashboard Page
 *
 * Unified dashboard showing user activity across all features.
 * Each section loads independently with its own loading state.
 * Graceful degradation: failed sections show error, don't block others.
 */
"use client";

import Link from "next/link";

import { useSubdomainBonfire } from "@/contexts";
import { useDashboardData } from "@/hooks";

import {
  DataRoomsSection,
  HyperBlogsSection,
  PaymentHistorySection,
  RecentChatsSection,
  WalletInfoSection,
} from "@/components/dashboard";
import { Header } from "@/components/shared/Header";

/**
 * Dashboard Page
 *
 * Unified dashboard showing user activity across all features.
 * Each section loads independently with its own loading state.
 * Graceful degradation: failed sections show error, don't block others.
 */

export default function DashboardPage() {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const bonfireIdOverride =
    isSubdomainScoped && subdomainConfig
      ? subdomainConfig.bonfireId
      : undefined;
  const dashboardData = useDashboardData(bonfireIdOverride);
  const isWalletConnected = dashboardData.wallet.isConnected;

  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      {/* Page header */}
      <header className="border-b border-base-300 bg-base-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-base-content/70 mt-1">
                Your activity across all features
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/graph" className="btn btn-outline btn-sm">
                Graph Explorer
              </Link>
              <Link href="/datarooms" className="btn btn-primary btn-sm">
                Data Rooms
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Chats - No wallet required */}
            <RecentChatsSection data={dashboardData.recentChats} />

            {/* My Data Rooms */}
            <DataRoomsSection
              createdDataRooms={dashboardData.createdDataRooms}
              subscribedDataRooms={dashboardData.subscribedDataRooms}
              isWalletConnected={isWalletConnected}
            />

            {/* My HyperBlogs */}
            <HyperBlogsSection
              data={dashboardData.hyperBlogs}
              isWalletConnected={isWalletConnected}
            />
          </div>

          {/* Right Column - Wallet & Payments */}
          <div className="space-y-6">
            {/* Wallet Info */}
            <WalletInfoSection wallet={dashboardData.wallet} />

            {/* Payment History */}
            <PaymentHistorySection
              data={dashboardData.paymentHistory}
              isWalletConnected={isWalletConnected}
            />

            {/* Quick Actions */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg">
                  <span className="mr-2">⚡</span>
                  Quick Actions
                </h2>
                <div className="space-y-2 mt-4">
                  <Link
                    href="/graph"
                    className="btn btn-block btn-outline justify-start gap-3"
                  >
                    <span>🔍</span>
                    Explore Knowledge Graph
                  </Link>
                  <Link
                    href="/x402-chat"
                    className="btn btn-block btn-outline justify-start gap-3"
                  >
                    <span>💬</span>
                    Start New Chat
                  </Link>
                  <Link
                    href="/datarooms"
                    className="btn btn-block btn-outline justify-start gap-3"
                  >
                    <span>🏠</span>
                    Browse Data Rooms
                  </Link>
                  <Link
                    href="/hyperblogs"
                    className="btn btn-block btn-outline justify-start gap-3"
                  >
                    <span>📝</span>
                    View HyperBlog Feed
                  </Link>
                  <Link
                    href="/documents"
                    className="btn btn-block btn-outline justify-start gap-3"
                  >
                    <span>📄</span>
                    Manage Documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
