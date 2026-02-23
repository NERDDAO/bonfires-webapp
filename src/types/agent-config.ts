/**
 * Agent Configuration Types
 *
 * TypeScript interfaces for the agent deployment wizard, matching
 * the agent-config-server schema (bonfires-ai/entities/agent-config.entity.ts).
 */

// ── Sub-types ────────────────────────────────────────────────────────────────

export interface TopicConfig {
  topicId: string;
  status?: "enabled" | "disabled";
  silentMode?: boolean;
  disableStoring?: boolean;
}

export interface GroupConfig {
  groupId: string;
  status?: "enabled" | "disabled";
  topicPolicy?: "open" | "restricted";
  silentMode?: boolean;
  topicConfigs?: TopicConfig[];
  disableStoring?: boolean;
}

export interface ChatConfig {
  groupPolicy?: "open" | "restricted";
  dmPolicy?: "open" | "restricted" | "disabled";
  silentMode?: boolean;
  allowedUsers?: string[];
  groupConfigs?: GroupConfig[];
  disableStoringGroups?: boolean;
  disableStoringDMs?: boolean;
  allowedUsersDMsStore?: string[];
  schedulingAllowedUsers?: string[];
}

export interface ReportingConfig {
  chatId: string;
  topicId?: string;
  shouldNotIgnore?: boolean;
}

export type AgentPlatform = "telegram" | "discord" | "web";

export interface AgentFeatures {
  isImageInputEnabled: boolean;
  isAudioInputEnabled: boolean;
  isDocumentInputEnabled: boolean;
  isImageGenerationEnabled: boolean;
  defaultImageGenerationModel: string;
  allowScheduling: boolean;
}

// ── Wizard form data ─────────────────────────────────────────────────────────

export interface AgentDeployFormData {
  // Step 1: Identity
  agentName: string;
  agentUsername: string;
  agentContext: string;
  timezone: string;

  // Step 2: Deployment
  platform: AgentPlatform;
  telegramBotToken: string;
  discordBotToken: string;
  reportingConfig: ReportingConfig | null;

  // Step 3: Features & Capabilities
  capabilities: string[];
  agentFeatures: AgentFeatures;

  // Step 4: Chat Policies
  chatConfig: ChatConfig;

  // Step 5: Tools & Environment
  enabledMcpTools: string[];
  agentEnvVars: Record<string, string>;

  // Activation
  isActive: boolean;
}

// ── API request/response ─────────────────────────────────────────────────────

export interface AgentDeployRequest {
  agentName: string;
  agentUsername: string;
  agentContext: string;
  bonfireId: string;
  platform?: AgentPlatform;
  telegramBotToken?: string;
  discordBotToken?: string;
  apiKey?: string;
  isActive?: boolean;
  timezone?: string;
  reportingConfig?: ReportingConfig;
  chatConfig?: ChatConfig;
  agentFeatures?: AgentFeatures;
  enabledMcpTools?: string[];
  agentEnvVars?: Record<string, string>;
  capabilities?: string[];
}

export interface AgentDeployResult {
  _id: string;
  name: string;
  username: string;
  isActive: boolean;
  deploymentConfiguration: {
    platform: AgentPlatform;
    bonfireId: string;
  };
}

// ── MCP Tools ────────────────────────────────────────────────────────────────

export interface McpTool {
  id: string;
  name: string;
  description?: string;
  group?: string;
}

// ── Token validation ─────────────────────────────────────────────────────────

export interface TokenValidationResult {
  valid: boolean;
  username?: string;
  id?: string | number;
  firstName?: string;
  isBot?: boolean;
  error?: string;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_AGENT_FEATURES: AgentFeatures = {
  isImageInputEnabled: false,
  isAudioInputEnabled: false,
  isDocumentInputEnabled: false,
  isImageGenerationEnabled: false,
  defaultImageGenerationModel: "flux-1-dev-fp8",
  allowScheduling: false,
};

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  groupPolicy: "open",
  dmPolicy: "open",
  silentMode: false,
  allowedUsers: [],
  groupConfigs: [],
  disableStoringGroups: false,
  disableStoringDMs: false,
  allowedUsersDMsStore: [],
  schedulingAllowedUsers: [],
};

export function createDefaultFormData(): AgentDeployFormData {
  return {
    agentName: "",
    agentUsername: "",
    agentContext: "",
    timezone: "",
    platform: "web",
    telegramBotToken: "",
    discordBotToken: "",
    reportingConfig: null,
    capabilities: [],
    agentFeatures: { ...DEFAULT_AGENT_FEATURES },
    chatConfig: { ...DEFAULT_CHAT_CONFIG },
    enabledMcpTools: [],
    agentEnvVars: {},
    isActive: false,
  };
}
