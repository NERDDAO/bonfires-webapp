"use client";

/**
 * PaidChatInterface Component
 *
 * Payment-gated AI chat interface with subscription management.
 */
import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/types";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { AgentSelector } from "@/components/shared/AgentSelector";

import {
  useAgentSelection,
  useMicrosubSelection,
  usePaymentHeader,
} from "@/hooks/web3";

import {
  formatErrorMessage,
  isMicrosubError,
  truncateAddress,
  truncateText,
} from "@/lib/utils";
import { useWalletAccount } from "@/lib/wallet/e2e";

type GraphMode = "adaptive" | "static" | "dynamic" | "none";

interface ChatResponseWithPayment {
  reply: string;
  payment?: {
    verified: boolean;
    settled: boolean;
    tx_hash?: string;
    queries_remaining?: number;
    expires_at?: string;
  };
}

interface PaidChatInterfaceProps {
  agentId?: string;
  dataroomId?: string;
  dataroomDescription?: string;
  dataroomCenterNodeUuid?: string;
  initialGraphMode?: GraphMode;
  selectedMicrosubTxHash?: string;
  onSubscriptionCreated?: (txHash: string) => void;
  className?: string;
}

export function PaidChatInterface({
  agentId: propAgentId,
  dataroomId,
  dataroomDescription,
  dataroomCenterNodeUuid,
  initialGraphMode,
  selectedMicrosubTxHash,
  onSubscriptionCreated,
  className = "",
}: PaidChatInterfaceProps) {
  const { isConnected, address } = useWalletAccount();
  const { buildAndSignPaymentHeader, isLoading: isSigningPayment } =
    usePaymentHeader();
  const microsubSelection = useMicrosubSelection({ walletAddress: address });
  const agentSelection = useAgentSelection();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<
    ChatResponseWithPayment["payment"] | null
  >(null);
  const [graphMode, setGraphMode] = useState<GraphMode>(
    initialGraphMode || "adaptive"
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveAgentId =
    propAgentId || agentSelection.selectedAgentId || "default-agent";

  // Auto-select subscription on mount
  useEffect(() => {
    if (
      selectedMicrosubTxHash &&
      microsubSelection.availableMicrosubs.length > 0 &&
      microsubSelection.selectedMicrosub?.tx_hash !== selectedMicrosubTxHash
    ) {
      microsubSelection.selectMicrosub(selectedMicrosubTxHash);
    }
  }, [selectedMicrosubTxHash, microsubSelection]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (
    messageText: string,
    chatHistory: ChatMessage[],
    retrying: boolean
  ) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!retrying) {
        const validation = microsubSelection.validateSelectedMicrosub();
        if (!validation.isValid) {
          setIsLoading(false);
          setError(
            "Selected subscription is invalid. Please select a different subscription or use new payment."
          );
          return;
        }
      }

      const paymentHeader = microsubSelection.selectedMicrosub
        ? await buildAndSignPaymentHeader(undefined, true)
        : await buildAndSignPaymentHeader();

      const requestBody: Record<string, unknown> = {
        message: messageText,
        chat_history: chatHistory,
        agent_id: effectiveAgentId,
        graph_mode: graphMode,
      };

      if (microsubSelection.selectedMicrosub) {
        requestBody["tx_hash"] = microsubSelection.selectedMicrosub.tx_hash;
        if (microsubSelection.selectedMicrosub.center_node_uuid) {
          requestBody["center_node_uuid"] =
            microsubSelection.selectedMicrosub.center_node_uuid;
        }
      } else if (paymentHeader) {
        requestBody["payment_header"] = paymentHeader;
      }

      if (dataroomId && !microsubSelection.selectedMicrosub) {
        requestBody["dataroom_id"] = dataroomId;
        if (dataroomCenterNodeUuid) {
          requestBody["center_node_uuid"] = dataroomCenterNodeUuid;
        }
      }

      const response = await fetch(`/api/agents/${effectiveAgentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: ChatResponseWithPayment = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      setPayment(data.payment);
      setIsRetrying(false);
      setIsLoading(false);

      if (
        data.payment?.tx_hash &&
        !microsubSelection.selectedMicrosub &&
        onSubscriptionCreated
      ) {
        onSubscriptionCreated(data.payment.tx_hash);
      }

      microsubSelection.refetch();
    } catch (err) {
      const microsubErrorInfo = isMicrosubError(err);

      if (microsubErrorInfo.isMicrosubError && !retrying) {
        microsubSelection.clearSelection();
        setIsRetrying(true);
        setTimeout(() => {
          send(messageText, chatHistory, true);
        }, 1000);
        return;
      }

      setError(formatErrorMessage(err));
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const messageText = input;
    const nextHistory = [...messages, userMessage];

    setMessages(nextHistory);
    setInput("");

    await send(messageText, nextHistory, false);
  };

  if (!isConnected) {
    return (
      <div className={`card bg-base-200 shadow-xl ${className}`}>
        <div className="card-body items-center text-center">
          <h2 className="card-title">Connect Your Wallet</h2>
          <p>Please connect your wallet to start chatting with the AI agent.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-[calc(100vh-4rem)] bg-base-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <h2 className="font-bold text-lg">AI Agent Chat</h2>
        <div className="flex gap-2 items-center">
          <select
            className="select select-sm select-bordered"
            value={graphMode}
            onChange={(e) => setGraphMode(e.target.value as GraphMode)}
          >
            <option value="adaptive">Adaptive</option>
            <option value="static">Static</option>
            <option value="dynamic">Dynamic</option>
            <option value="none">None</option>
          </select>
          {payment && (
            <div className="badge badge-success gap-1">
              {payment.queries_remaining !== undefined
                ? `${payment.queries_remaining} queries left`
                : "Paid"}
            </div>
          )}
        </div>
      </div>

      {/* Agent Selection (if no agentId provided) */}
      {!propAgentId && (
        <div className="p-4 border-b border-base-300">
          <AgentSelector
            state={agentSelection.selectionState}
            onBonfireChange={agentSelection.selectBonfire}
            onAgentChange={agentSelection.selectAgent}
            variant="compact"
          />
        </div>
      )}

      {/* Alerts */}
      {dataroomId && !microsubSelection.selectedMicrosub && (
        <div className="alert alert-info mx-4 mt-2">
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">
              📁 Subscribing to Data Room
            </div>
            <div className="text-xs opacity-80">
              Your first message will create a subscription to this data room.
            </div>
          </div>
        </div>
      )}

      {microsubSelection.selectedMicrosub?.description && (
        <div className="alert alert-info mx-4 mt-2">
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">
              📁 Data Room Active
            </div>
            <div className="text-xs opacity-80">
              {microsubSelection.selectedMicrosub.description}
            </div>
            {microsubSelection.selectedMicrosub.center_node_uuid && (
              <div className="text-xs opacity-70 mt-1">
                🎯 Center node:{" "}
                {truncateAddress(
                  microsubSelection.selectedMicrosub.center_node_uuid,
                  6
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center text-base-content/50 mt-20">
            {dataroomDescription
              ? `Agent ready. Ask about ${truncateText(dataroomDescription, 60)}...`
              : "Start a conversation..."}
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"} mb-4`}
          >
            <div
              className={`chat-bubble ${
                msg.role === "user"
                  ? "chat-bubble-primary"
                  : "chat-bubble-secondary"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <span className="loading loading-dots loading-lg"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mx-4 mb-2">
          <span>{error}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-base-300 p-4">
        <div className="flex gap-2">
          <textarea
            className="textarea textarea-bordered flex-1"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={
              isLoading ||
              isSigningPayment ||
              microsubSelection.loading ||
              isRetrying
            }
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={
              !input.trim() ||
              isLoading ||
              isSigningPayment ||
              microsubSelection.loading ||
              isRetrying
            }
          >
            {isRetrying ? (
              "Retrying..."
            ) : isLoading || isSigningPayment ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
