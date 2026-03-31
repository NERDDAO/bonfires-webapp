/**
 * Text block utilities: text extraction, tokenization, shared word detection.
 */

// --- Types ---

export type BoundingBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

// --- Constants ---

const MIN_WORD_LENGTH = 3;

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

// --- N-gram similarity ---

const NGRAM_SIZE = 3;
const SIMILARITY_THRESHOLD = 0.3;

function getTrigrams(word: string): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i <= word.length - NGRAM_SIZE; i++) {
    grams.add(word.slice(i, i + NGRAM_SIZE));
  }
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

/** Inverted index: trigram → list of words containing it */
type TrigramIndex = Map<string, string[]>;

function buildTrigramIndex(words: Iterable<string>): { index: TrigramIndex; grams: Map<string, Set<string>> } {
  const index: TrigramIndex = new Map();
  const grams = new Map<string, Set<string>>();
  for (const word of words) {
    const wGrams = getTrigrams(word);
    grams.set(word, wGrams);
    for (const gram of wGrams) {
      let list = index.get(gram);
      if (!list) {
        list = [];
        index.set(gram, list);
      }
      list.push(word);
    }
  }
  return { index, grams };
}

export type WordSimilarity = {
  /** The matching word in the other block */
  match: string;
  /** Jaccard similarity 0..1 */
  similarity: number;
};

/**
 * Find fuzzy-similar words between two word maps using trigram Jaccard.
 * Returns a map from each word in `a` to its best match in `b` (if above threshold).
 * Uses inverted trigram index to avoid comparing all pairs.
 */
export function findSimilarWords(
  a: Map<string, number>,
  b: Map<string, number>,
): Map<string, WordSimilarity> {
  const result = new Map<string, WordSimilarity>();

  // Build trigram index for b
  const { index: bIndex, grams: bGrams } = buildTrigramIndex(b.keys());
  // Precompute trigrams for a
  const aGrams = new Map<string, Set<string>>();
  for (const word of a.keys()) {
    aGrams.set(word, getTrigrams(word));
  }

  for (const [wordA, gramsA] of aGrams) {
    // Find candidate words in b that share at least one trigram
    const candidates = new Set<string>();
    for (const gram of gramsA) {
      const matches = bIndex.get(gram);
      if (matches) {
        for (const m of matches) candidates.add(m);
      }
    }

    // Find best match among candidates
    let bestMatch = "";
    let bestSim = 0;
    for (const wordB of candidates) {
      const gramsB = bGrams.get(wordB)!;
      const sim = jaccardSimilarity(gramsA, gramsB);
      if (sim > bestSim) {
        bestSim = sim;
        bestMatch = wordB;
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD) {
      result.set(wordA, { match: bestMatch, similarity: bestSim });
    }
  }

  return result;
}
