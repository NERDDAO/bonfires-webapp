/**
 * Text block renderer: uses pretext to lay out node content as wrapped
 * paragraphs on canvas. When two text blocks overlap, shared words
 * are highlighted.
 */

import {
  prepareWithSegments,
  layoutWithLines,
} from "@chenglou/pretext";

import type { ViewNode } from "./force-graph-types";
import {
  type BoundingBox,
  extractNodeText,
  tokenize,
  findSharedWords,
  boundsOverlap,
} from "./word-cloud-utils";

// --- Types ---

type TextBlockLine = {
  text: string;
  width: number;
  y: number;
};

type NodeTextBlock = {
  nodeId: string;
  color: string;
  lines: TextBlockLine[];
  bounds: BoundingBox;
  wordMap: Map<string, number>;
  highlightedWords: Set<string>;
  /** Timestamp when this block was created (for fade-in animation) */
  createdAt: number;
};

export type WordCloudState = {
  blocks: Map<string, NodeTextBlock>;
  font: string;
  blockWidth: number;
  lineHeight: number;
  _tokenWidths: Map<string, number>;
  _lastPositionHash: number;
  /** Timestamp when state was built (for animation timing) */
  _createdAt: number;
};

// --- Constants ---

const FONT_FAMILY = "system-ui, sans-serif";
const FONT_SIZE = 9;
const FONT_WEIGHT = "400";
const FONT = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`;
const LINE_HEIGHT = FONT_SIZE * 1.4;
const BLOCK_WIDTH = 140;
const MAX_LINES = 12;
const HIGHLIGHT_COLOR = "#f5572a";
const MAX_TEXT_LENGTH = 800;
const FADE_IN_DURATION = 1200; // ms for full fade-in
const FADE_STAGGER_PER_LINE = 60; // ms delay between consecutive lines
const HIGHLIGHT_PULSE_SPEED = 0.003; // radians per ms for pulse oscillation

// --- Build ---

export function buildWordClouds(
  nodes: ViewNode[],
  elementDataMap: Map<string, Record<string, unknown>>,
): WordCloudState {
  const now = performance.now();
  const blocks = new Map<string, NodeTextBlock>();

  for (const node of nodes) {
    const data = elementDataMap.get(node.id);
    if (!data) continue;

    let text = extractNodeText(data);
    if (!text.trim()) continue;

    // Truncate very long content to keep prepare() fast
    if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH) + "...";

    const prepared = prepareWithSegments(text, FONT);
    const result = layoutWithLines(prepared, BLOCK_WIDTH, LINE_HEIGHT);

    const cx = node.x ?? 0;
    const cy = node.y ?? 0;

    const lineCount = Math.min(result.lines.length, MAX_LINES);
    const blockHeight = lineCount * LINE_HEIGHT;

    const blockTop = cy - blockHeight / 2;
    const blockLeft = cx - BLOCK_WIDTH / 2;

    const lines: TextBlockLine[] = result.lines.slice(0, MAX_LINES).map((line, i) => ({
      text: line.text,
      width: line.width,
      y: blockTop + i * LINE_HEIGHT,
    }));

    const bounds: BoundingBox = {
      x: blockLeft,
      y: blockTop,
      w: BLOCK_WIDTH,
      h: blockHeight,
    };

    blocks.set(node.id, {
      nodeId: node.id,
      color: node.color,
      lines,
      bounds,
      wordMap: tokenize(text),
      highlightedWords: new Set(),
      createdAt: now,
    });
  }

  return {
    blocks,
    font: FONT,
    blockWidth: BLOCK_WIDTH,
    lineHeight: LINE_HEIGHT,
    _tokenWidths: new Map(),
    _lastPositionHash: 0,
    _createdAt: now,
  };
}

// --- Update positions when nodes move ---

export function updateBlockPositions(
  state: WordCloudState,
  nodes: ViewNode[],
): void {
  for (const node of nodes) {
    const block = state.blocks.get(node.id);
    if (!block) continue;

    const cx = node.x ?? 0;
    const cy = node.y ?? 0;
    const blockHeight = block.lines.length * state.lineHeight;
    const blockTop = cy - blockHeight / 2;
    const blockLeft = cx - state.blockWidth / 2;

    // Update line positions
    for (let i = 0; i < block.lines.length; i++) {
      block.lines[i]!.y = blockTop + i * state.lineHeight;
    }

    block.bounds = {
      x: blockLeft,
      y: blockTop,
      w: state.blockWidth,
      h: blockHeight,
    };
  }
}

// --- Detect overlap and mark shared words ---

function markHighlights(state: WordCloudState, nodes: ViewNode[]): void {
  // Reset
  for (const block of state.blocks.values()) {
    block.highlightedWords = new Set();
  }

  const nodeArr = nodes.filter((n) => state.blocks.has(n.id));
  for (let i = 0; i < nodeArr.length; i++) {
    for (let j = i + 1; j < nodeArr.length; j++) {
      const a = state.blocks.get(nodeArr[i]!.id)!;
      const b = state.blocks.get(nodeArr[j]!.id)!;

      if (!boundsOverlap(a.bounds, b.bounds)) continue;

      const shared = findSharedWords(a.wordMap, b.wordMap);
      if (shared.size === 0) continue;

      for (const word of shared) {
        a.highlightedWords.add(word);
        b.highlightedWords.add(word);
      }
    }
  }
}

// --- Position hash for dirty tracking ---

function computePositionHash(nodes: ViewNode[], blocks: Map<string, NodeTextBlock>): number {
  let hash = 0;
  for (const node of nodes) {
    if (!blocks.has(node.id)) continue;
    hash = (hash * 31 + ((node.x ?? 0) * 100 | 0) + ((node.y ?? 0) * 100 | 0)) | 0;
  }
  return hash;
}

// --- Cached token width measurement ---

function getTokenWidth(token: string, ctx: CanvasRenderingContext2D, cache: Map<string, number>): number {
  let w = cache.get(token);
  if (w === undefined) {
    w = ctx.measureText(token).width;
    cache.set(token, w);
  }
  return w;
}

// --- Render ---

export function renderTextBlocks(
  ctx: CanvasRenderingContext2D,
  state: WordCloudState,
  nodes: ViewNode[],
): void {
  updateBlockPositions(state, nodes);

  const hash = computePositionHash(nodes, state.blocks);
  if (hash !== state._lastPositionHash) {
    state._lastPositionHash = hash;
    markHighlights(state, nodes);
  }

  const now = performance.now();
  const pulseAlpha = 0.8 + 0.2 * Math.sin(now * HIGHLIGHT_PULSE_SPEED);

  ctx.font = state.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const block of state.blocks.values()) {
    const blockLeft = block.bounds.x;
    const hasHighlights = block.highlightedWords.size > 0;
    const blockAge = now - block.createdAt;

    for (let lineIdx = 0; lineIdx < block.lines.length; lineIdx++) {
      const line = block.lines[lineIdx]!;

      // Staggered fade-in: each line fades in slightly after the previous
      const lineDelay = lineIdx * FADE_STAGGER_PER_LINE;
      const lineAge = blockAge - lineDelay;
      const fadeProgress = Math.min(1, Math.max(0, lineAge / FADE_IN_DURATION));
      if (fadeProgress <= 0) continue;

      if (!hasHighlights) {
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.7 * fadeProgress;
        ctx.fillText(line.text, blockLeft, line.y);
      } else {
        const words = line.text.split(/(\s+)/);
        let xOffset = blockLeft;

        for (const token of words) {
          const isWord = /\S/.test(token);
          const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");

          if (isWord && block.highlightedWords.has(normalized)) {
            ctx.fillStyle = HIGHLIGHT_COLOR;
            ctx.globalAlpha = pulseAlpha * fadeProgress;
          } else {
            ctx.fillStyle = block.color;
            ctx.globalAlpha = 0.7 * fadeProgress;
          }

          ctx.fillText(token, xOffset, line.y);
          xOffset += getTokenWidth(token, ctx, state._tokenWidths);
        }
      }
    }
  }

  ctx.globalAlpha = 1;
}

/** Returns true if any block is still animating (fade-in not complete). */
export function isAnimating(state: WordCloudState): boolean {
  const now = performance.now();
  for (const block of state.blocks.values()) {
    const totalDuration = block.lines.length * FADE_STAGGER_PER_LINE + FADE_IN_DURATION;
    if (now - block.createdAt < totalDuration) return true;
  }
  return false;
}
