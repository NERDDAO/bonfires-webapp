/**
 * MCP Tools API Route
 *
 * GET /api/agent-config/mcp-tools - List available MCP tools
 *
 * Returns the set of available tool groups that can be enabled per-agent.
 * These match the built-in tool groups from the bonfires-ai runtime.
 */
import {
  createSuccessResponse,
  handleCorsOptions,
} from "@/lib/api/server-utils";

const AVAILABLE_TOOLS = [
  {
    id: "trimtab",
    name: "Trimtab",
    description: "Web search and content retrieval tools",
    group: "builtin",
  },
  {
    id: "scheduling",
    name: "Scheduling",
    description: "Task scheduling and reminder tools",
    group: "builtin",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    description: "Twitter/X social media integration",
    group: "builtin",
  },
  {
    id: "message_search",
    name: "Message Search",
    description: "Search through conversation history",
    group: "builtin",
  },
  {
    id: "identity",
    name: "Identity",
    description: "Agent identity and self-reference tools",
    group: "builtin",
  },
];

export async function GET() {
  return createSuccessResponse(AVAILABLE_TOOLS);
}

export function OPTIONS() {
  return handleCorsOptions();
}
