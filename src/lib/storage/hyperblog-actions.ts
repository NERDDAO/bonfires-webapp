/**
 * Local storage for HyperBlog user actions (votes) across all hyperblogs.
 * Single object keyed by hyperblog id; used when the API does not return user vote state.
 */

const STORAGE_KEY = "hyperblog_user_actions";

export type UserVote = "upvote" | "downvote" | null;

export interface HyperBlogUserActions {
  votes: Record<string, UserVote>;
}

const DEFAULT_ACTIONS: HyperBlogUserActions = {
  votes: {},
};

function getActions(): HyperBlogUserActions {
  if (typeof window === "undefined") {
    return DEFAULT_ACTIONS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_ACTIONS;
    const parsed = JSON.parse(raw) as HyperBlogUserActions;
    if (parsed && typeof parsed.votes === "object") {
      return { votes: parsed.votes };
    }
    return DEFAULT_ACTIONS;
  } catch {
    return DEFAULT_ACTIONS;
  }
}

function setActions(actions: HyperBlogUserActions): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch {
    // ignore
  }
}

/**
 * Get the stored user vote for a hyperblog.
 */
export function getStoredVote(hyperblogId: string): UserVote {
  const actions = getActions();
  const v = actions.votes[hyperblogId];
  return v === "upvote" || v === "downvote" ? v : null;
}

/**
 * Store the user vote for a hyperblog (after a successful API vote response).
 */
export function setStoredVote(
  hyperblogId: string,
  vote: UserVote
): void {
  const actions = getActions();
  if (vote === null) {
    const { [hyperblogId]: _, ...rest } = actions.votes;
    setActions({ votes: rest });
  } else {
    setActions({
      votes: { ...actions.votes, [hyperblogId]: vote },
    });
  }
}
