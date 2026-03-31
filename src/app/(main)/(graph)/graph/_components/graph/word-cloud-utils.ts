/**
 * Text block utilities: text extraction, tokenization, shared word detection,
 * and obstacle geometry for text routing around neighboring nodes.
 *
 * Geometry functions adapted from @chenglou/pretext/pages/demos/wrap-geometry.ts (MIT)
 */

// --- Types ---

export type BoundingBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Interval = {
  left: number;
  right: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// --- Constants ---

const MIN_WORD_LENGTH = 3;
const OBSTACLE_H_PAD = 6;
const OBSTACLE_V_PAD = 2;
const MIN_SLOT_WIDTH = 24;

const STOPWORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there",
  "their", "what", "so", "up", "out", "if", "about", "who", "get",
  "which", "go", "me", "when", "make", "can", "like", "time", "no",
  "just", "him", "know", "take", "people", "into", "year", "your",
  "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first",
  "well", "way", "even", "new", "want", "because", "any", "these",
  "give", "day", "most", "us", "was", "were", "been", "has", "had",
  "are", "is", "did", "does", "being", "more", "very", "should",
]);

// --- Text extraction ---

function extractStringValues(obj: unknown): string {
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) return obj.map(extractStringValues).join(" ");
  if (obj && typeof obj === "object") {
    return Object.values(obj).map(extractStringValues).join(" ");
  }
  return "";
}

export function extractNodeText(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof data["content"] === "string") parts.push(data["content"]);
  else if (data["content"]) parts.push(extractStringValues(data["content"]));

  if (typeof data["summary"] === "string") parts.push(data["summary"]);
  if (typeof data["name"] === "string") parts.push(data["name"]);

  if (Array.isArray(data["labels"])) {
    parts.push(data["labels"].filter((l): l is string => typeof l === "string").join(" "));
  }

  const props = data["properties"] ?? data["attributes"];
  if (props && typeof props === "object") {
    const p = props as Record<string, unknown>;
    if (typeof p["content"] === "string") parts.push(p["content"]);
    if (typeof p["summary"] === "string") parts.push(p["summary"]);
  }

  return parts.join(" ");
}

// --- Tokenization ---

export function tokenize(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = text.toLowerCase().split(/[^a-z0-9]+/);
  for (const word of words) {
    if (word.length < MIN_WORD_LENGTH || STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return freq;
}

// --- Shared words ---

export function findSharedWords(
  a: Map<string, number>,
  b: Map<string, number>,
): Set<string> {
  const shared = new Set<string>();
  for (const word of a.keys()) {
    if (b.has(word)) shared.add(word);
  }
  return shared;
}

export function boundsOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  );
}

// --- Obstacle geometry (from pretext's wrap-geometry.ts) ---

/**
 * Given rect obstacles and a horizontal y-band, return which horizontal
 * intervals are blocked by those rects.
 */
export function getRectIntervalsForBand(
  rects: Rect[],
  bandTop: number,
  bandBottom: number,
): Interval[] {
  const intervals: Interval[] = [];
  for (const rect of rects) {
    if (bandBottom <= rect.y - OBSTACLE_V_PAD || bandTop >= rect.y + rect.height + OBSTACLE_V_PAD) continue;
    intervals.push({
      left: rect.x - OBSTACLE_H_PAD,
      right: rect.x + rect.width + OBSTACLE_H_PAD,
    });
  }
  return intervals;
}

/**
 * Carve available text slots from a base interval by removing blocked intervals.
 * Discards slivers narrower than MIN_SLOT_WIDTH.
 */
export function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots: Interval[] = [base];

  for (const interval of blocked) {
    const next: Interval[] = [];
    for (const slot of slots) {
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot);
        continue;
      }
      if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left });
      if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right });
    }
    slots = next;
  }

  return slots.filter(slot => slot.right - slot.left >= MIN_SLOT_WIDTH);
}
