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
