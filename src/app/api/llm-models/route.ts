/**
 * LLM Models API Route
 *
 * GET /api/llm-models - List active LLM model presets
 */
import {
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET() {
  return handleProxyRequest("/llm-models/list");
}

export function OPTIONS() {
  return handleCorsOptions();
}
