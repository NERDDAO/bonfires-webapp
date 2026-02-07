/**
 * Utility Functions
 *
 * Common utility functions for formatting, validation, and error handling.
 */
import removeMd from "remove-markdown";

/**
 * Truncate an Ethereum address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format an ISO timestamp to a human-readable string
 */
export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format a number for display
 */
export function formatNumber(number: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: decimals,
  }).format(number);
}

/**
 * Extract user-friendly error message from various error types
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    if (error.includes("409") || error.includes("Conflict")) {
      return "Subscription exhausted. Retrying with new payment...";
    }
    if (error.includes("expired")) {
      return "Subscription has expired. Please use a new payment.";
    }
    if (error.includes("exhausted")) {
      return "Subscription has no queries remaining. Please use a new payment.";
    }
    return error;
  }

  if (error instanceof Error) {
    if (error.message.includes("409") || error.message.includes("Conflict")) {
      return "Subscription exhausted. Retrying with new payment...";
    }
    if (error.message.includes("expired")) {
      return "Subscription has expired. Please use a new payment.";
    }
    if (error.message.includes("exhausted")) {
      return "Subscription has no queries remaining. Please use a new payment.";
    }
    if (error.message.includes("User rejected")) {
      return "Transaction was rejected by user";
    }
    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds to complete transaction";
    }
    if (error.message.includes("network")) {
      return "Network error. Please check your connection and try again.";
    }
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Detect if an error is related to microsub validity issues
 */
export function isMicrosubError(error: unknown): {
  isMicrosubError: boolean;
  errorType?: "expired" | "exhausted" | "invalid";
} {
  let message = "";

  if (typeof error === "string") {
    message = error.toLowerCase();
  } else if (error instanceof Error) {
    message = error.message.toLowerCase();
  } else if (error && typeof error === "object" && "message" in error) {
    message = String((error as { message: unknown }).message).toLowerCase();
  }

  if (!message) {
    return { isMicrosubError: false };
  }

  if (message.includes("expired") || message.includes("expiration")) {
    return { isMicrosubError: true, errorType: "expired" };
  }

  if (
    message.includes("exhausted") ||
    message.includes("no queries remaining")
  ) {
    return { isMicrosubError: true, errorType: "exhausted" };
  }

  if (message.includes("invalid") || message.includes("not found")) {
    return { isMicrosubError: true, errorType: "invalid" };
  }

  if (message.includes("409") || message.includes("conflict")) {
    return { isMicrosubError: true, errorType: "exhausted" };
  }

  if (message.includes("microsub") || message.includes("subscription")) {
    return { isMicrosubError: true, errorType: "invalid" };
  }

  return { isMicrosubError: false };
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format token amount with decimals for display
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 6,
  displayDecimals: number = 2
): string {
  try {
    const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
    const divisor = Math.pow(10, decimals);
    const value = amountNum / divisor;
    return value.toFixed(displayDecimals);
  } catch {
    return String(amount);
  }
}

/**
 * Shorten a long text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Calculate reading time estimate from word count
 */
export function calculateReadingTime(wordCount: number): string {
  if (!wordCount || wordCount <= 0) return "";

  const minutes = Math.ceil(wordCount / 200);

  if (minutes < 1) {
    return "< 1 min read";
  } else if (minutes === 1) {
    return "1 min read";
  } else {
    return `${minutes} min read`;
  }
}

/**
 * Return formatted blog length information from word count
 * @param wordCount
 * @returns
 */
export function formatBlogLength(wordCount: number): string {
  if (wordCount < 1000) return "Short";
  if (wordCount < 2000) return "Medium";
  return "Long";
}

/**
 * Return formatted reading time information from word count
 * @param price
 * @returns
 */
export function formatReadingTime(wordCount: number): {
  formattedBlogLength: string;
  formattedWordCount: string;
  formattedReadingTime: string;
} {
  const formattedBlogLength = formatBlogLength(wordCount);
  const formattedWordCount = `${wordCount} words`;
  const formattedReadingTime = calculateReadingTime(wordCount);
  return { formattedBlogLength, formattedWordCount, formattedReadingTime };
}

/**
 * Format USD price for display
 */
export function formatUsdPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Smart truncate preview text at sentence boundaries
 */
export function truncatePreviewSmart(
  preview: string | null,
  maxLength: number = 280
): string {
  if (!preview) return "No preview available";
  if (preview.length <= maxLength) return preview;

  const truncationZoneStart = Math.floor(maxLength * 0.8);
  const truncationZone = preview.slice(truncationZoneStart, maxLength);

  const regex = /[.!?](?=\s|$)/g;
  let lastSentenceEnd = -1;
  let match;
  while ((match = regex.exec(truncationZone)) !== null) {
    lastSentenceEnd = match.index;
  }

  if (lastSentenceEnd !== -1) {
    const truncated = preview.slice(
      0,
      truncationZoneStart + lastSentenceEnd + 1
    );
    if (truncated.length < preview.length) {
      return truncated + " ...";
    }
    return truncated;
  }

  const lastSpace = preview.lastIndexOf(" ", maxLength);
  if (lastSpace > truncationZoneStart) {
    return preview.slice(0, lastSpace) + "...";
  }

  return preview.slice(0, maxLength) + "...";
}

export function getTextFromMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return "";
  return removeMd(markdown).trim();
}
