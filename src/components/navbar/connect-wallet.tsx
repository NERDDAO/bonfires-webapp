import { useEffect, useState } from "react";

import Image from "next/image";

import { truncateAddress } from "@/lib";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useDisconnect, useSwitchChain } from "wagmi";

import { cn } from "@/lib/cn";
import {
  isE2EWalletEnabled,
  setE2EWalletState,
  useE2EBalance,
  useWalletAccount,
} from "@/lib/wallet/e2e";

import Dropdown from "../ui/dropdown";

export default function ConnectWallet() {
  const { address, isConnected, isConnecting } = useWalletAccount();
  // Use connection's chainId (actual wallet chain), not useChainId() which stays at
  // configured default when wallet is on an unconfigured chain (e.g. Phantom on Ethereum).
  const { chainId } = useAccount();
  const { switchChain, chains, isPending: isSwitchPending } = useSwitchChain();

  // Use the chain from wagmi config so switchChain always targets a chain we actually have.
  // config.web3.chainId can be out of sync (e.g. NEXT_PUBLIC_CHAIN_ID vs NEXT_PUBLIC_ENVIRONMENT).
  const targetChainId = chains?.[0]?.id ?? null;
  const e2eBalance = useE2EBalance();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const [hasMounted, setHasMounted] = useState(false);

  const loading = hasMounted && isConnecting;
  const formattedAddress = address ? truncateAddress(address, 2) : "";
  const largeFormattedAddress = address ? truncateAddress(address, 6) : "";

  const balance = isE2EWalletEnabled() ? e2eBalance : balanceData;
  const formattedBalance = balance
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol ?? "ETH"}`
    : "0.0000 ETH";

  // Resolve current chain from wallet; target chain from wagmi config (same source as switchChain)
  const currentChain =
    chainId != null ? chains?.find((c) => c.id === chainId) : undefined;
  const isCorrectChain =
    chainId != null &&
    targetChainId != null &&
    Number(chainId) === targetChainId;

  const currentChainLabel =
    chainId == null
      ? "Connecting…"
      : isCorrectChain
        ? (currentChain?.name ?? `Chain ${chainId}`)
        : "Wrong network";

  // Prevent hydration mismatch by only showing dynamic content after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!isConnected) {
    return (
      <button
        className={cn(
          "flex items-center gap-3 font-normal text-sm py-2 px-2 border border-[#3B1517] rounded-lg bg-brand-black cursor-pointer hover:bg-dark-s-900 transition-colors duration-200",
          loading && "skeleton"
        )}
        onClick={() => {
          if (isE2EWalletEnabled()) {
            setE2EWalletState(true);
            return;
          }
          openConnectModal?.();
        }}
        disabled={loading}
      >
        <Image
          src="/icons/wallet.svg"
          alt="Connect Wallet"
          width={20}
          height={20}
          className={cn(loading ? "opacity-40" : "")}
        />
      </button>
    );
  }

  return (
    <Dropdown
      trigger={(open, onToggle) => (
        <button
          className={cn(
            "flex items-center gap-3 font-normal text-sm py-2 px-5 border border-[#3B1517] rounded-lg bg-brand-black cursor-pointer hover:bg-dark-s-900 transition-colors duration-200",
            loading && "skeleton"
          )}
          onClick={onToggle}
          disabled={loading}
        >
          <Image
            src="/icons/wallet.svg"
            alt="Connect Wallet"
            width={20}
            height={20}
            className={cn(loading ? "opacity-40" : "")}
          />
          {isConnected && (
            <span className="text-sm text-dark-s-0">{formattedAddress}</span>
          )}
        </button>
      )}
      className="min-w-60 pt-2"
    >
      {[
        { label: "Address", value: largeFormattedAddress },
        { label: "Balance", value: formattedBalance },
        { label: "Network", value: currentChainLabel },
      ].map((item) => (
        <li
          key={item.label}
          role="menuitem"
          className="text-sm block px-4 py-2 text-dark-s-0"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-dark-s-0/50">{item.label}</div>
          <span>{item.value}</span>
        </li>
      ))}
      <div className="flex mt-2 justify-center mx-auto border-t border-[#3B1517] gap-4 py-2 bg-[#1A1C1F] rounded-b-lg">
        {[
          {
            icon: "/icons/copy.svg",
            alt: "Copy Address",
            onClick: () => {
              if (address) {
                navigator.clipboard.writeText(address);
              }
            },
          },
          {
            icon: "/icons/switch.svg",
            alt: "Switch Network",
            onClick: () => {
              if (targetChainId != null) {
                switchChain({ chainId: targetChainId });
              }
            },
            disabled: targetChainId == null || isCorrectChain || isSwitchPending,
          },
          {
            icon: "/icons/log-out.svg",
            alt: "Disconnect Wallet",
            onClick: () => {
              if (isE2EWalletEnabled()) {
                setE2EWalletState(false);
              } else {
                disconnect();
              }
            },
          },
        ].map((item) => (
          <button
            key={item.alt}
            type="button"
            onClick={item.onClick}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={"disabled" in item ? item.disabled : false}
            className={cn(
              "rounded-lg text-sm p-2 text-dark-s-0 opacity-80 hover:opacity-100 cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Image
              src={item.icon}
              alt={item.alt}
              width={20}
              height={20}
              className="w-4 h-4"
            />
          </button>
        ))}
      </div>
    </Dropdown>
  );
}
