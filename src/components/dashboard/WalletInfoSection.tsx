/**
 * WalletInfoSection Component
 *
 * Displays wallet connection status, balance, and connection controls.
 * Shows a prompt to connect if not connected.
 */
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import type { WalletState } from "@/types/web3";

import { DashboardSection } from "./DashboardSection";

/**
 * WalletInfoSection Component
 *
 * Displays wallet connection status, balance, and connection controls.
 * Shows a prompt to connect if not connected.
 */

interface WalletInfoSectionProps {
  wallet: WalletState;
}

/**
 * Format address for display
 */
function formatAddress(address: string | null): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format balance for display
 */
function formatBalance(balance: string | null): string {
  if (!balance) return "0.0000";
  const num = parseFloat(balance);
  if (isNaN(num)) return "0.0000";
  return num.toFixed(4);
}

/**
 * Connected wallet display
 */
function ConnectedWallet({ wallet }: { wallet: WalletState }) {
  return (
    <div className="space-y-4">
      {/* Address */}
      <div className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success">
            ✓
          </div>
          <div>
            <p className="text-sm text-base-content/70">Connected Address</p>
            <p className="font-mono font-medium">
              {formatAddress(wallet.address)}
            </p>
          </div>
        </div>
        <a
          href={`https://explorer.testnet.abs.xyz/address/${wallet.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-ghost"
        >
          View ↗
        </a>
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            💰
          </div>
          <div>
            <p className="text-sm text-base-content/70">Balance</p>
            <p className="font-semibold text-lg">
              {formatBalance(wallet.balance)} ETH
            </p>
          </div>
        </div>
      </div>

      {/* Network */}
      <div className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center text-info">
            🌐
          </div>
          <div>
            <p className="text-sm text-base-content/70">Network</p>
            <p className="font-medium">
              {wallet.chainId === 11124
                ? "Abstract Testnet"
                : `Chain ${wallet.chainId}`}
            </p>
          </div>
        </div>
        <span className="badge badge-success badge-sm">Connected</span>
      </div>

      {/* Disconnect button */}
      <div className="flex justify-center pt-2">
        <ConnectButton.Custom>
          {({ openAccountModal }) => (
            <button
              onClick={openAccountModal}
              className="btn btn-sm btn-outline btn-error"
            >
              Disconnect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}

/**
 * Disconnected wallet prompt
 */
function DisconnectedWallet() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-6xl mb-4">🔗</div>
      <h3 className="font-bold text-xl mb-2">Connect Your Wallet</h3>
      <p className="text-base-content/70 mb-6 max-w-sm">
        Connect your wallet to access Web3 features like Data Rooms, HyperBlogs,
        and paid services.
      </p>
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button onClick={openConnectModal} className="btn btn-primary btn-lg">
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>
      <p className="text-xs text-base-content/50 mt-4">
        We support MetaMask, WalletConnect, and other popular wallets.
      </p>
    </div>
  );
}

export function WalletInfoSection({ wallet }: WalletInfoSectionProps) {
  return (
    <DashboardSection
      title="Wallet"
      icon="💰"
      isLoading={wallet.isConnecting}
      isError={false}
      skeletonRows={3}
    >
      {wallet.isConnected ? (
        <ConnectedWallet wallet={wallet} />
      ) : (
        <DisconnectedWallet />
      )}
    </DashboardSection>
  );
}
