/**
 * Chat History Storage
 *
 * Manages chat history persistence in localStorage with automatic pruning.
 */

const STORAGE_KEY = "delve.chat.history";
const MAX_MESSAGES_PER_AGENT = 100;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  payment_tx?: string;
}

interface ChatHistoryStore {
  [agentId: string]: {
    messages: ChatMessage[];
    lastUpdated: string;
  };
}

/**
 * Get all chat history from localStorage
 */
function getChatHistoryStore(): ChatHistoryStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored) as ChatHistoryStore;
  } catch {
    return {};
  }
}

/**
 * Save chat history store to localStorage
 */
function saveChatHistoryStore(store: ChatHistoryStore): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn("Failed to save chat history", error);
    // If storage is full, try to prune old messages
    pruneOldMessages(store);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Give up if still failing
    }
  }
}

/**
 * Get chat history for a specific agent
 */
export function getChatHistory(agentId: string): ChatMessage[] {
  const store = getChatHistoryStore();
  return store[agentId]?.messages ?? [];
}

/**
 * Add a message to chat history for an agent
 */
export function addChatMessage(agentId: string, message: ChatMessage): void {
  const store = getChatHistoryStore();

  if (!store[agentId]) {
    store[agentId] = {
      messages: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  store[agentId].messages.push(message);
  store[agentId].lastUpdated = new Date().toISOString();

  // Prune if exceeding max messages
  if (store[agentId].messages.length > MAX_MESSAGES_PER_AGENT) {
    store[agentId].messages = store[agentId].messages.slice(
      -MAX_MESSAGES_PER_AGENT
    );
  }

  saveChatHistoryStore(store);
}

/**
 * Clear chat history for a specific agent
 */
export function clearChatHistory(agentId: string): void {
  const store = getChatHistoryStore();
  delete store[agentId];
  saveChatHistoryStore(store);
}

/**
 * Clear all chat history
 */
export function clearAllChatHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Get recent chats summary for dashboard
 */
export function getRecentChats(): Array<{
  agentId: string;
  lastMessage: string;
  lastUpdated: string;
  messageCount: number;
}> {
  const store = getChatHistoryStore();

  return Object.entries(store)
    .map(([agentId, data]) => ({
      agentId,
      lastMessage: data.messages.at(-1)?.content ?? "",
      lastUpdated: data.lastUpdated,
      messageCount: data.messages.length,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
}

/**
 * Prune old messages from all agents to free up storage
 */
function pruneOldMessages(store: ChatHistoryStore): void {
  const halfMax = Math.floor(MAX_MESSAGES_PER_AGENT / 2);

  for (const agentId of Object.keys(store)) {
    const agentData = store[agentId];
    if (agentData && agentData.messages.length > halfMax) {
      agentData.messages = agentData.messages.slice(-halfMax);
    }
  }
}

/**
 * Get total message count across all agents
 */
export function getTotalMessageCount(): number {
  const store = getChatHistoryStore();
  return Object.values(store).reduce(
    (total, data) => total + data.messages.length,
    0
  );
}
