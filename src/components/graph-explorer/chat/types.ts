/**
 * Chat panel types
 */
import type { PanelMode } from "@/hooks";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatPanelProps {
  /** Agent ID for the chat */
  agentId?: string;
  /** Agent name for display */
  agentName?: string;
  /** Chat history messages */
  messages: ChatMessage[];
  /** Whether a message is being sent */
  isSending: boolean;
  /** Current panel mode */
  mode: PanelMode;
  /** Error message */
  error?: string | null;
  /** Callback to send a message */
  onSendMessage: (content: string) => Promise<void>;
  /** Callback to change panel mode */
  onModeChange: (mode: PanelMode) => void;
  /** Callback to clear error */
  onClearError?: () => void;
  /** Additional CSS classes */
  className?: string;
}
