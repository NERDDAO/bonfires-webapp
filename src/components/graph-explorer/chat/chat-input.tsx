/**
 * Chat input with textarea and send button.
 * Input styled like search query; send button like zoom (IconButton).
 */

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { IconButton } from "@/components/graph-explorer/ui/icon-button";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isSending: boolean;
  hasAgent: boolean;
  /** Focus when panel opens */
  autoFocus?: boolean;
}

const inputClass =
  "flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm lg:text-base resize-none min-h-[40px] max-h-[120px] bg-[#181818] border border-[#333333] text-white placeholder:text-[#A9A9A9] focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-[#646464] disabled:opacity-50";

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  isSending,
  hasAgent,
  autoFocus,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div className="p-3 border-t border-[#333333] shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasAgent ? "Type a message..." : "Select an agent first"}
          disabled={disabled}
          rows={1}
          className={inputClass}
        />
        <IconButton
          onClick={onSend}
          disabled={!value.trim() || isSending || !hasAgent}
          aria-label="Send message"
          title="Send"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </IconButton>
      </div>
    </div>
  );
}
