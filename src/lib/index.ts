// API Client
export { apiClient, ApiClient } from "./api/client";

// Storage
export {
  graphPreferences,
  documentsPreferences,
  chatPreferences,
  delvePreferences,
  uiPreferences,
  clearAllPreferences,
  STORAGE_KEYS,
} from "./storage/preferences";

export {
  getChatHistory,
  addChatMessage,
  clearChatHistory,
  clearAllChatHistory,
  getRecentChats,
  getTotalMessageCount,
  type ChatMessage,
} from "./storage/chatHistory";

// Config
export { config, getEnvVar, requireEnvVar } from "./config";

// Wallet Utilities
export {
  formatWalletAddress,
  formatBalance,
  isValidAddress,
  isSameAddress,
  isContractAddress,
  useWalletIdentity,
  useIsOwner,
  useUserWallet,
  useRequireWallet,
  useIsCorrectChain,
  useFormattedBalance,
} from "./wallet";

// Utility Functions
export {
  truncateAddress,
  formatTimestamp,
  formatErrorMessage,
  isMicrosubError,
  formatTokenAmount,
  truncateText,
  calculateReadingTime,
  formatUsdPrice,
  truncatePreviewSmart,
} from "./utils";

// Payment Utilities
export {
  buildPaymentTypedData,
  encodePaymentHeader,
  type X402PaymentHeader,
  type PaymentConfig,
  type TypedData,
  type TransferWithAuthorization,
  type X402PaymentPayload,
  type BuildPaymentHeaderParams,
} from "./payment";
