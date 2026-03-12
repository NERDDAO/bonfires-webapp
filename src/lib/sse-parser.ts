import type { BatchSSEEvent } from "@/types/applicant-reviews";

/**
 * Parses raw SSE text chunks into typed event objects.
 * Handles accumulating event/data lines and buffering incomplete lines across chunks.
 */
export class SSEParser {
  private buffer = "";
  private currentEvent = "";
  private currentData: string[] = [];

  /**
   * Feed a raw text chunk and get back any complete events.
   */
  parse(chunk: string): BatchSSEEvent[] {
    const events: BatchSSEEvent[] = [];
    this.buffer += chunk;

    const lines = this.buffer.split("\n");
    // Keep the last element as buffer if it doesn't end with newline
    this.buffer = chunk.endsWith("\n") ? "" : (lines.pop() ?? "");

    for (const line of lines) {
      if (line === "" || line === "\r") {
        // Blank line = event delimiter
        if (this.currentData.length > 0) {
          const parsed = this.emitEvent();
          if (parsed) events.push(parsed);
        }
        this.currentEvent = "";
        this.currentData = [];
        continue;
      }

      const trimmed = line.replace(/\r$/, "");

      if (trimmed.startsWith("event:")) {
        this.currentEvent = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        this.currentData.push(trimmed.slice(5).trim());
      } else if (trimmed.startsWith("id:")) {
        // SSE id field — we use seq from data payload instead
      } else if (trimmed.startsWith(":")) {
        // Comment line (used for keep-alive), ignore
      }
    }

    return events;
  }

  private emitEvent(): BatchSSEEvent | null {
    const dataStr = this.currentData.join("\n");
    if (!dataStr) return null;

    try {
      const data = JSON.parse(dataStr) as BatchSSEEvent;
      // If the event type is set via the event: field, use it
      if (this.currentEvent && !(data as unknown as Record<string, unknown>)["type"]) {
        (data as unknown as Record<string, unknown>)["type"] = this.currentEvent;
      }
      return data;
    } catch {
      console.warn("[SSE Parser] Failed to parse event data:", dataStr);
      return null;
    }
  }

  /**
   * Reset parser state.
   */
  reset(): void {
    this.buffer = "";
    this.currentEvent = "";
    this.currentData = [];
  }
}
