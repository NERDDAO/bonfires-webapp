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
};

export type WordCloudState = {
  blocks: Map<string, NodeTextBlock>;
  font: string;
  blockWidth: number;
  lineHeight: number;
  /** Cached token widths for highlight rendering */
  _tokenWidths: Map<string, number>;
  /** Tracks whether positions changed since last highlight computation */
  _lastPositionHash: number;
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

// --- Build ---

export function buildWordClouds(
  nodes: ViewNode[],
  elementDataMap: Map<string, Record<string, unknown>>,
): WordCloudState {
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
    });
  }

  return {
    blocks,
    font: FONT,
    blockWidth: BLOCK_WIDTH,
    lineHeight: LINE_HEIGHT,
    _tokenWidths: new Map(),
    _lastPositionHash: 0,
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

  // Only recompute highlights when positions changed
  const hash = computePositionHash(nodes, state.blocks);
  if (hash !== state._lastPositionHash) {
    state._lastPositionHash = hash;
    markHighlights(state, nodes);
  }

  ctx.font = state.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const block of state.blocks.values()) {
    const blockLeft = block.bounds.x;
    const hasHighlights = block.highlightedWords.size > 0;

    for (const line of block.lines) {
      if (!hasHighlights) {
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.7;
        ctx.fillText(line.text, blockLeft, line.y);
      } else {
        const words = line.text.split(/(\s+)/);
        let xOffset = blockLeft;

        for (const token of words) {
          const isWord = /\S/.test(token);
          const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");

          if (isWord && block.highlightedWords.has(normalized)) {
            ctx.fillStyle = HIGHLIGHT_COLOR;
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = block.color;
            ctx.globalAlpha = 0.7;
          }

          ctx.fillText(token, xOffset, line.y);
          xOffset += getTokenWidth(token, ctx, state._tokenWidths);
        }
      }
    }
  }

  ctx.globalAlpha = 1;
}
