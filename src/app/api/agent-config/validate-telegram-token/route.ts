/**
 * Validate Telegram Token API Route
 *
 * POST /api/agent-config/validate-telegram-token
 *
 * Validates a Telegram bot token by calling the Telegram Bot API directly.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface TelegramBotInfo {
  ok: boolean;
  result?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
  description?: string;
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
    const res = await fetch(`https://api.telegram.org/bot${body.token}/getMe`, {
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as TelegramBotInfo;

    if (!data.ok || !data.result) {
      return createSuccessResponse({
        valid: false,
        error: data.description ?? "Invalid token",
      });
    }

    return createSuccessResponse({
      valid: true,
      username: data.result.username,
      id: data.result.id,
      firstName: data.result.first_name,
      isBot: data.result.is_bot,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token validation failed";
    return createSuccessResponse({ valid: false, error: msg });
  }
}

export function OPTIONS() {
  return handleCorsOptions();
}
