/**
 * Text block renderer: uses pretext's layoutNextLine() with per-line obstacle
 * routing. Text flows around neighboring node bounding boxes — each line gets
 * a different available width carved by whatever obstacles intersect its y-band.
 *
 * Pattern adapted from @chenglou/pretext/pages/demos/dynamic-layout.ts
 */

import {
  prepareWithSegments,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext";

import type { ViewNode } from "./force-graph-types";
import { RADIUS_BY_SIZE } from "./force-graph-constants";
import {
  type BoundingBox,
  type Rect,
  extractNodeText,
  tokenize,
  findSharedWords,
  getRectIntervalsForBand,
  carveTextLineSlots,
} from "./word-cloud-utils";

// --- Types ---

type PositionedLine = {
  x: number;
  y: number;
  width: number;
  text: string;
};

type NodeTextBlock = {
  nodeId: string;
  color: string;
  prepared: PreparedTextWithSegments;
  lines: PositionedLine[];
  bounds: BoundingBox;
  wordMap: Map<string, number>;
  highlightedWords: Set<string>;
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
const BLOCK_WIDTH = 150;
const MAX_LINES = 14;
const HIGHLIGHT_COLOR = "#f5572a";
const MAX_TEXT_LENGTH = 800;
const FADE_IN_DURATION = 1200;
const FADE_STAGGER_PER_LINE = 60;
const HIGHLIGHT_PULSE_SPEED = 0.003;

// --- Build (initial, no obstacles — just prepare the text) ---

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

    blocks.set(node.id, {
      nodeId: node.id,
      color: node.color,
      prepared,
      lines: [],
      bounds: { x: 0, y: 0, w: 0, h: 0 },
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

// --- Obstacle-routed layout (runs when positions change) ---

function layoutWithObstacles(
  state: WordCloudState,
  nodes: ViewNode[],
): void {
  // Build obstacle rects from ALL nodes (each block + each node circle is an obstacle for others)
  const nodeRects = new Map<string, Rect>();
  for (const node of nodes) {
    const r = RADIUS_BY_SIZE[node.size] ?? 12;
    const nx = node.x ?? 0;
    const ny = node.y ?? 0;
    // Node circle obstacle
    nodeRects.set(node.id, {
      x: nx - r,
      y: ny - r,
      width: r * 2,
      height: r * 2,
    });
  }

  // First pass: layout each block with only node-circle obstacles (not other blocks)
  for (const node of nodes) {
    const block = state.blocks.get(node.id);
    if (!block) continue;

    const cx = node.x ?? 0;
    const cy = node.y ?? 0;

    // Region where this block's text can flow
    const regionHeight = MAX_LINES * state.lineHeight;
    const region: Rect = {
      x: cx - state.blockWidth / 2,
      y: cy - regionHeight / 2,
      width: state.blockWidth,
      height: regionHeight,
    };

    // Obstacles: other nodes' circles only (not other text blocks —
    // overlapping blocks is intentional, that's where shared word highlights work)
    const obstacles: Rect[] = [];
    for (const [otherId, rect] of nodeRects) {
      if (otherId === node.id) continue;
      obstacles.push(rect);
    }

    // Layout line-by-line with obstacle routing
    const lines: PositionedLine[] = [];
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    let lineTop = region.y;

    while (lines.length < MAX_LINES) {
      if (lineTop + state.lineHeight > region.y + region.height) break;

      const bandTop = lineTop;
      const bandBottom = lineTop + state.lineHeight;

      const blocked = getRectIntervalsForBand(obstacles, bandTop, bandBottom);
      const slots = carveTextLineSlots(
        { left: region.x, right: region.x + region.width },
        blocked,
      );

      if (slots.length === 0) {
        lineTop += state.lineHeight;
        continue;
      }

      // Pick the widest available slot
      let best = slots[0]!;
      for (let i = 1; i < slots.length; i++) {
        const s = slots[i]!;
        if (s.right - s.left > best.right - best.left) best = s;
      }

      const slotWidth = best.right - best.left;
      const line = layoutNextLine(block.prepared, cursor, slotWidth);
      if (!line) break;

      lines.push({
        x: Math.round(best.left),
        y: Math.round(lineTop),
        width: line.width,
        text: line.text,
      });

      cursor = line.end;
      lineTop += state.lineHeight;
    }

    block.lines = lines;

    // Compute actual bounds from placed lines
    if (lines.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      const minY = lines[0]!.y;
      const maxY = lines[lines.length - 1]!.y + state.lineHeight;
      for (const l of lines) {
        if (l.x < minX) minX = l.x;
        if (l.x + l.width > maxX) maxX = l.x + l.width;
      }
      block.bounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    } else {
      block.bounds = { x: cx, y: cy, w: 0, h: 0 };
    }
  }
}

// --- Shared word highlights ---

function markHighlights(state: WordCloudState, nodes: ViewNode[]): void {
  for (const block of state.blocks.values()) {
    block.highlightedWords = new Set();
  }

  const nodeArr = nodes.filter((n) => state.blocks.has(n.id));
  for (let i = 0; i < nodeArr.length; i++) {
    for (let j = i + 1; j < nodeArr.length; j++) {
      const a = state.blocks.get(nodeArr[i]!.id)!;
      const b = state.blocks.get(nodeArr[j]!.id)!;

      // Check proximity, not just AABB overlap
      const ax = nodeArr[i]!.x ?? 0;
      const bx = nodeArr[j]!.x ?? 0;
      const ay = nodeArr[i]!.y ?? 0;
      const by = nodeArr[j]!.y ?? 0;
      if (Math.hypot(bx - ax, by - ay) > 250) continue;

      const shared = findSharedWords(a.wordMap, b.wordMap);
      for (const word of shared) {
        a.highlightedWords.add(word);
        b.highlightedWords.add(word);
      }
    }
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

// --- Hit test ---

export function nodeUnderBlock(
  state: WordCloudState,
  nodes: ViewNode[],
  x: number,
  y: number,
): ViewNode | null {
  for (const node of nodes) {
    const block = state.blocks.get(node.id);
    if (!block || block.lines.length === 0) continue;
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
    layoutWithObstacles(state, nodes);
    markHighlights(state, nodes);
  }

  const now = performance.now();
  const pulseAlpha = 0.8 + 0.2 * Math.sin(now * HIGHLIGHT_PULSE_SPEED);

  ctx.font = state.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const block of state.blocks.values()) {
    const hasHighlights = block.highlightedWords.size > 0;
    const blockAge = now - block.createdAt;

    for (let lineIdx = 0; lineIdx < block.lines.length; lineIdx++) {
      const line = block.lines[lineIdx]!;

      const lineDelay = lineIdx * FADE_STAGGER_PER_LINE;
      const lineAge = blockAge - lineDelay;
      const fadeProgress = Math.min(1, Math.max(0, lineAge / FADE_IN_DURATION));
      if (fadeProgress <= 0) continue;

      if (!hasHighlights) {
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.7 * fadeProgress;
        ctx.fillText(line.text, line.x, line.y);
      } else {
        const words = line.text.split(/(\s+)/);
        let xOffset = line.x;

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

export function isAnimating(state: WordCloudState): boolean {
  const now = performance.now();
  for (const block of state.blocks.values()) {
    const totalDuration = block.lines.length * FADE_STAGGER_PER_LINE + FADE_IN_DURATION;
    if (now - block.createdAt < totalDuration) return true;
  }
  return false;
}
