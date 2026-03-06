/**
 * Validate Discord Token API Route
 *
 * POST /api/agent-config/validate-discord-token
 *
 * Validates a Discord bot token by calling the Discord API directly.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  bot?: boolean;
}

export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<{ token: string }>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }
  if (!body?.token) {
    return createErrorResponse("token is required", 400);
  }

  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${body.token}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return createSuccessResponse({
        valid: false,
        error: `Discord API returned ${res.status}: ${text.slice(0, 200)}`,
      });
    }

    const data = (await res.json()) as DiscordUser;

    return createSuccessResponse({
      valid: true,
      username: data.username,
      id: data.id,
      firstName: data.global_name ?? data.username,
      isBot: data.bot ?? false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token validation failed";
    return createSuccessResponse({ valid: false, error: msg });
  }
}

export function OPTIONS() {
  return handleCorsOptions();
}
