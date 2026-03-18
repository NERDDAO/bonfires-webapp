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

export type AgentPlatform = "telegram" | "discord";

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

  // Step 3: Features
  agentFeatures: AgentFeatures;

  // Step 4: Chat Policies
  chatConfig: ChatConfig;

  // Step 5: Tools, Skills & Environment
  enabledMcpTools: string[];
  enabledSkills: string[];
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
  enabledSkills?: string[];
  agentEnvVars?: Record<string, string>;
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

export interface AgentFullResponse {
  id: string;
  username: string;
  name: string;
  context: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  bonfire_ref: string | null;
  api_key: string | null;
  chatConfig: ChatConfig | null;
  deploymentConfiguration: {
    platform?: AgentPlatform;
    bonfireId?: string;
    telegramBotToken?: string;
    discordBotToken?: string;
    reportingGroupId?: string;
    reportingConfig?: ReportingConfig;
  } | null;
  agentFeatures: AgentFeatures | null;
  enabledMcpTools: string[];
  enabledSkills: string[];
  timezone: string | null;
  agentEnvVars: Record<string, string> | null;
}

export interface AgentUpdateRequest {
  name?: string;
  context?: string;
  is_active?: boolean;
  chatConfig?: ChatConfig;
  agentFeatures?: AgentFeatures;
  deploymentConfiguration?: Record<string, unknown>;
  enabledMcpTools?: string[];
  enabledSkills?: string[];
  timezone?: string;
  agentEnvVars?: Record<string, string>;
}

// ── MCP Tools ────────────────────────────────────────────────────────────────

export interface McpTool {
  id: string;
  name: string;
  description?: string;
  group?: string;
}

// ── Skills ───────────────────────────────────────────────────────────────────

export interface SkillInfo {
  skillId: string;
  name: string;
  description?: string;
}

export interface SkillsListResponse {
  skills: SkillInfo[];
  count: number;
}

// ── Env Vars ──────────────────────────────────────────────────────────────────

export interface EnvVarEntry {
  key: string;
  has_value: boolean;
}

export interface EnvVarsListResponse {
  agent_id: string;
  vars: EnvVarEntry[];
  count: number;
}

export interface EnvVarsUpsertResponse {
  agent_id: string;
  updated_keys: string[];
  count: number;
}

export interface EnvVarDeleteResponse {
  agent_id: string;
  key: string;
  deleted: boolean;
}

// ── Personality ───────────────────────────────────────────────────────────────

export interface PersonalityTrait {
  id: string;
  section: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonalityResponse {
  agent_id: string;
  traits: PersonalityTrait[];
  sections: Record<string, PersonalityTrait[]>;
  total_traits: number;
}

export interface PersonalityTraitsModifyResponse {
  agent_id: string;
  modified_count: number;
  traits: PersonalityTrait[];
}

export interface ToolsListResponse {
  tools: McpTool[];
  count: number;
}

// ── Agent Delete ──────────────────────────────────────────────────────────────

export interface AgentDeleteResponse {
  agent_id: string;
  deactivated: boolean;
  unregistered: boolean;
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
    platform: "telegram",
    telegramBotToken: "",
    discordBotToken: "",
    reportingConfig: null,
    agentFeatures: { ...DEFAULT_AGENT_FEATURES },
    chatConfig: { ...DEFAULT_CHAT_CONFIG },
    enabledMcpTools: [],
    enabledSkills: [],
    agentEnvVars: {},
    isActive: false,
  };
}

export function agentResponseToFormData(agent: AgentFullResponse): AgentDeployFormData {
  const deploy = agent.deploymentConfiguration;
  const platform = (deploy?.platform ?? "telegram") as AgentPlatform;
  return {
    agentName: agent.name,
    agentUsername: agent.username,
    agentContext: agent.context,
    timezone: agent.timezone ?? "",
    platform,
    telegramBotToken: "",
    discordBotToken: "",
    reportingConfig: deploy?.reportingConfig ?? null,
    agentFeatures: agent.agentFeatures
      ? { ...DEFAULT_AGENT_FEATURES, ...agent.agentFeatures }
      : { ...DEFAULT_AGENT_FEATURES },
    chatConfig: agent.chatConfig
      ? { ...DEFAULT_CHAT_CONFIG, ...agent.chatConfig }
      : { ...DEFAULT_CHAT_CONFIG },
    enabledMcpTools: agent.enabledMcpTools ?? [],
    enabledSkills: agent.enabledSkills ?? [],
    agentEnvVars: agent.agentEnvVars ?? {},
    isActive: agent.is_active,
  };
}
