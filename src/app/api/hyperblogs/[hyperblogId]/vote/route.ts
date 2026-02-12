/**
 * HyperBlog Vote API Route
 *
 * POST /api/hyperblogs/[hyperblogId]/vote - Register like (upvote) or dislike (downvote)
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ hyperblogId: string }>;
}

/** Request body for voting (vote_type + user_wallet required) */
interface HyperBlogVoteRequest {
  vote_type: "upvote" | "downvote";
  user_wallet: string;
}

/**
 * POST /api/hyperblogs/[hyperblogId]/vote
 *
 * Register or toggle a vote. Same vote again removes it; opposite vote changes it.
 * Requires user_wallet.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { hyperblogId } = await params;

  if (!hyperblogId) {
    return createErrorResponse("HyperBlog ID is required", 400);
  }

  const { data: body, error } = await parseJsonBody<HyperBlogVoteRequest>(
    request
  );
  if (error) {
    return createErrorResponse(error, 400);
  }

  const voteType = body?.vote_type;
  const userWallet = body?.user_wallet?.trim();

  if (voteType !== "upvote" && voteType !== "downvote") {
    return createErrorResponse(
      "vote_type must be 'upvote' or 'downvote'",
      400
    );
  }
  if (!userWallet) {
    return createErrorResponse("user_wallet is required", 400);
  }

  return handleProxyRequest(
    `/datarooms/hyperblogs/${hyperblogId}/vote`,
    {
      method: "POST",
      body: { vote_type: voteType, user_wallet: userWallet },
      includeAuth: false,
    }
  );
}

/**
 * OPTIONS /api/hyperblogs/[hyperblogId]/vote
 */
export function OPTIONS() {
  return handleCorsOptions();
}
