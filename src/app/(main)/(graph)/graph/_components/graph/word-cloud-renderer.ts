/**
 * Text block renderer: uses pretext to lay out node content as wrapped
 * paragraphs on canvas. When two text blocks overlap, shared words
 * are highlighted and text deforms toward the neighbor (membrane effect).
 */

import {
  prepareWithSegments,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
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
  /** X offset from blockLeft (0 = normal, positive = shifted right) */
  xShift: number;
};

type OverlapInfo = {
  neighborNodeId: string;
  /** Direction toward neighbor: -1 = neighbor is left, +1 = neighbor is right */
  dirX: number;
  /** Squeeze factor 0..1 (how much to narrow on the facing side) */
  squeeze: number;
  sharedWords: Set<string>;
};

type NodeTextBlock = {
  nodeId: string;
  color: string;
  prepared: PreparedTextWithSegments;
  lines: TextBlockLine[];
  bounds: BoundingBox;
  wordMap: Map<string, number>;
  highlightedWords: Set<string>;
  overlaps: OverlapInfo[];
  createdAt: number;
};

export type WordCloudState = {
  blocks: Map<string, NodeTextBlock>;
  font: string;
  blockWidth: number;
  lineHeight: number;
  _tokenWidths: Map<string, number>;
  _lastPositionHash: number;
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
const FADE_IN_DURATION = 1200;
const FADE_STAGGER_PER_LINE = 60;
const HIGHLIGHT_PULSE_SPEED = 0.003;
const MAX_SQUEEZE = 0.35; // max 35% width reduction on facing side
const SQUEEZE_RANGE = 200; // px distance at which squeeze starts
const SHARED_WORD_PULL = 12; // px offset toward neighbor for shared words

// --- Build ---

function layoutBlock(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
): { text: string; width: number }[] {
  const lines: { text: string; width: number }[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  for (let i = 0; i < MAX_LINES; i++) {
    const line = layoutNextLine(prepared, cursor, maxWidth);
    if (!line) break;
    lines.push({ text: line.text, width: line.width });
    cursor = line.end;
  }
  return lines;
}

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

    if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH) + "...";

    const prepared = prepareWithSegments(text, FONT);
    const rawLines = layoutBlock(prepared, BLOCK_WIDTH);

    const cx = node.x ?? 0;
    const cy = node.y ?? 0;
    const blockHeight = rawLines.length * LINE_HEIGHT;
    const blockTop = cy - blockHeight / 2;
    const blockLeft = cx - BLOCK_WIDTH / 2;

    const lines: TextBlockLine[] = rawLines.map((line, i) => ({
      text: line.text,
      width: line.width,
      y: blockTop + i * LINE_HEIGHT,
      xShift: 0,
    }));

    blocks.set(node.id, {
      nodeId: node.id,
      color: node.color,
      prepared,
      lines,
      bounds: { x: blockLeft, y: blockTop, w: BLOCK_WIDTH, h: blockHeight },
      wordMap: tokenize(text),
      highlightedWords: new Set(),
      overlaps: [],
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

// --- Update positions + membrane deformation ---

function computeOverlaps(state: WordCloudState, nodes: ViewNode[]): void {
  for (const block of state.blocks.values()) {
    block.overlaps = [];
    block.highlightedWords = new Set();
  }

  const nodeArr = nodes.filter((n) => state.blocks.has(n.id));
  for (let i = 0; i < nodeArr.length; i++) {
    for (let j = i + 1; j < nodeArr.length; j++) {
      const ni = nodeArr[i]!;
      const nj = nodeArr[j]!;
      const a = state.blocks.get(ni.id)!;
      const b = state.blocks.get(nj.id)!;

      // Check proximity (not just AABB overlap — we want gradual deformation)
      const ax = ni.x ?? 0;
      const ay = ni.y ?? 0;
      const bx = nj.x ?? 0;
      const by = nj.y ?? 0;
      const dist = Math.hypot(bx - ax, by - ay);
      if (dist > SQUEEZE_RANGE) continue;

      const shared = findSharedWords(a.wordMap, b.wordMap);
      if (shared.size === 0) continue;

      const squeeze = Math.max(0, 1 - dist / SQUEEZE_RANGE) * MAX_SQUEEZE;
      const dirX = bx - ax;
      const normalizedDirX = dirX === 0 ? 1 : dirX / Math.abs(dirX);

      a.overlaps.push({ neighborNodeId: nj.id, dirX: normalizedDirX, squeeze, sharedWords: shared });
      b.overlaps.push({ neighborNodeId: ni.id, dirX: -normalizedDirX, squeeze, sharedWords: shared });

      for (const word of shared) {
        a.highlightedWords.add(word);
        b.highlightedWords.add(word);
      }
    }
  }
}

function relayoutDeformed(state: WordCloudState, nodes: ViewNode[]): void {
  for (const node of nodes) {
    const block = state.blocks.get(node.id);
    if (!block) continue;

    const cx = node.x ?? 0;
    const cy = node.y ?? 0;

    // Compute effective squeeze from all overlaps
    let maxSqueeze = 0;
    let squeezeDir = 0;
    for (const overlap of block.overlaps) {
      if (overlap.squeeze > maxSqueeze) {
        maxSqueeze = overlap.squeeze;
        squeezeDir = overlap.dirX;
      }
    }

    // Re-layout with variable width if squeezed
    const effectiveWidth = state.blockWidth * (1 - maxSqueeze);
    const rawLines = layoutBlock(block.prepared, effectiveWidth);

    const blockHeight = rawLines.length * LINE_HEIGHT;
    const blockTop = cy - blockHeight / 2;
    const blockLeft = cx - effectiveWidth / 2;

    // Shift block toward neighbor side when squeezed (membrane bulge)
    const bulgeShift = maxSqueeze * squeezeDir * 10;

    block.lines = rawLines.map((line, i) => ({
      text: line.text,
      width: line.width,
      y: blockTop + i * LINE_HEIGHT,
      xShift: bulgeShift,
    }));

    block.bounds = {
      x: blockLeft + bulgeShift,
      y: blockTop,
      w: effectiveWidth,
      h: blockHeight,
    };
  }
}

// --- Position hash ---

function computePositionHash(nodes: ViewNode[], blocks: Map<string, NodeTextBlock>): number {
  let hash = 0;
  for (const node of nodes) {
    if (!blocks.has(node.id)) continue;
    hash = (hash * 31 + ((node.x ?? 0) * 100 | 0) + ((node.y ?? 0) * 100 | 0)) | 0;
  }
  return hash;
}

// --- Cached token width ---

function getTokenWidth(token: string, ctx: CanvasRenderingContext2D, cache: Map<string, number>): number {
  let w = cache.get(token);
  if (w === undefined) {
    w = ctx.measureText(token).width;
    cache.set(token, w);
  }
  return w;
}

// --- Hit test: is a point inside any text block? ---

export function nodeUnderBlock(
  state: WordCloudState,
  nodes: ViewNode[],
  x: number,
  y: number,
): ViewNode | null {
  for (const node of nodes) {
    const block = state.blocks.get(node.id);
    if (!block) continue;
    const b = block.bounds;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return node;
    }
  }
  return null;
}

// --- Render ---

export function renderTextBlocks(
  ctx: CanvasRenderingContext2D,
  state: WordCloudState,
  nodes: ViewNode[],
): void {
  const hash = computePositionHash(nodes, state.blocks);
  if (hash !== state._lastPositionHash) {
    state._lastPositionHash = hash;
    computeOverlaps(state, nodes);
    relayoutDeformed(state, nodes);
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

    // Compute pull direction for shared words
    let pullX = 0;
    if (hasHighlights && block.overlaps.length > 0) {
      for (const overlap of block.overlaps) {
        pullX += overlap.dirX * SHARED_WORD_PULL * overlap.squeeze / MAX_SQUEEZE;
      }
    }

    for (let lineIdx = 0; lineIdx < block.lines.length; lineIdx++) {
      const line = block.lines[lineIdx]!;

      const lineDelay = lineIdx * FADE_STAGGER_PER_LINE;
      const lineAge = blockAge - lineDelay;
      const fadeProgress = Math.min(1, Math.max(0, lineAge / FADE_IN_DURATION));
      if (fadeProgress <= 0) continue;

      const lineX = blockLeft + line.xShift;

      if (!hasHighlights) {
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.7 * fadeProgress;
        ctx.fillText(line.text, lineX, line.y);
      } else {
        const words = line.text.split(/(\s+)/);
        let xOffset = lineX;

        for (const token of words) {
          const isWord = /\S/.test(token);
          const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");
          const isShared = isWord && block.highlightedWords.has(normalized);

          if (isShared) {
            ctx.fillStyle = HIGHLIGHT_COLOR;
            ctx.globalAlpha = pulseAlpha * fadeProgress;
            // Pull shared words toward neighbor
            ctx.fillText(token, xOffset + pullX, line.y);
          } else {
            ctx.fillStyle = block.color;
            ctx.globalAlpha = 0.7 * fadeProgress;
            ctx.fillText(token, xOffset, line.y);
          }

          xOffset += getTokenWidth(token, ctx, state._tokenWidths);
        }
      }
    }
  }

  ctx.globalAlpha = 1;
}

/** Returns true if any block is still animating. */
export function isAnimating(state: WordCloudState): boolean {
  const now = performance.now();
  for (const block of state.blocks.values()) {
    const totalDuration = block.lines.length * FADE_STAGGER_PER_LINE + FADE_IN_DURATION;
    if (now - block.createdAt < totalDuration) return true;
  }
  return false;
}
