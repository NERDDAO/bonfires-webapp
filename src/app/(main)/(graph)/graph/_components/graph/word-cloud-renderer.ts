/**
 * Text block renderer: uses pretext for clean paragraph layout at each node.
 * When blocks are near each other, shared words get highlighted and blocks
 * gently repel to reduce overlap.
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
} from "./word-cloud-utils";

// --- Types ---

type PositionedLine = {
  text: string;
  width: number;
  /** Relative y offset from block top */
  relY: number;
};

type NeighborEffect = {
  /** Unit direction toward neighbor */
  dirX: number;
  dirY: number;
  /** 0..1 proximity strength (1 = touching, 0 = far) */
  strength: number;
};

type NodeTextBlock = {
  nodeId: string;
  color: string;
  prepared: PreparedTextWithSegments;
  lines: PositionedLine[];
  blockHeight: number;
  wordMap: Map<string, number>;
  highlightedWords: Set<string>;
  nudgeX: number;
  nudgeY: number;
  /** Strongest neighbor effect (for taper + word pull) */
  neighbor: NeighborEffect | null;
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
const REPULSION_RANGE = 280;
const MAX_NUDGE = 60;
const WORD_PULL = 14;
const TAPER_AMOUNT = 20;

// --- Build ---

function layoutBlock(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
): PositionedLine[] {
  const lines: PositionedLine[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  for (let i = 0; i < MAX_LINES; i++) {
    const line = layoutNextLine(prepared, cursor, maxWidth);
    if (!line) break;
    lines.push({ text: line.text, width: line.width, relY: i * LINE_HEIGHT });
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
    const lines = layoutBlock(prepared, BLOCK_WIDTH);

    blocks.set(node.id, {
      nodeId: node.id,
      color: node.color,
      prepared,
      lines,
      blockHeight: lines.length * LINE_HEIGHT,
      wordMap: tokenize(text),
      highlightedWords: new Set(),
      nudgeX: 0,
      nudgeY: 0,
      neighbor: null,
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

// --- Compute block bounds (with nudge) ---

function getBlockBounds(
  node: ViewNode,
  block: NodeTextBlock,
  blockWidth: number,
): BoundingBox {
  const cx = (node.x ?? 0) + block.nudgeX;
  const cy = (node.y ?? 0) + block.nudgeY;
  return {
    x: cx - blockWidth / 2,
    y: cy - block.blockHeight / 2,
    w: blockWidth,
    h: block.blockHeight,
  };
}

// --- Soft repulsion + shared word highlights ---

function computeProximityEffects(state: WordCloudState, nodes: ViewNode[]): void {
  for (const block of state.blocks.values()) {
    block.highlightedWords = new Set();
    block.nudgeX = 0;
    block.nudgeY = 0;
    block.neighbor = null;
  }

  const nodeArr = nodes.filter((n) => state.blocks.has(n.id));
  for (let i = 0; i < nodeArr.length; i++) {
    for (let j = i + 1; j < nodeArr.length; j++) {
      const ni = nodeArr[i]!;
      const nj = nodeArr[j]!;
      const ax = ni.x ?? 0;
      const ay = ni.y ?? 0;
      const bx = nj.x ?? 0;
      const by = nj.y ?? 0;
      const dist = Math.hypot(bx - ax, by - ay);
      if (dist > REPULSION_RANGE || dist < 0.1) continue;

      const a = state.blocks.get(ni.id)!;
      const b = state.blocks.get(nj.id)!;

      const shared = findSharedWords(a.wordMap, b.wordMap);
      for (const word of shared) {
        a.highlightedWords.add(word);
        b.highlightedWords.add(word);
      }

      const proximity = Math.max(0, 1 - dist / REPULSION_RANGE);
      const dx = bx - ax;
      const dy = by - ay;
      const nx = dx / dist;
      const ny = dy / dist;

      // Repulsion
      const nudge = proximity * MAX_NUDGE;
      a.nudgeX -= nx * nudge;
      a.nudgeY -= ny * nudge;
      b.nudgeX += nx * nudge;
      b.nudgeY += ny * nudge;

      // Track strongest neighbor for taper/pull effects
      if (!a.neighbor || proximity > a.neighbor.strength) {
        a.neighbor = { dirX: nx, dirY: ny, strength: proximity };
      }
      if (!b.neighbor || proximity > b.neighbor.strength) {
        b.neighbor = { dirX: -nx, dirY: -ny, strength: proximity };
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
    const b = getBlockBounds(node, block, state.blockWidth);
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
    computeProximityEffects(state, nodes);
  }

  const now = performance.now();
  const pulseAlpha = 0.8 + 0.2 * Math.sin(now * HIGHLIGHT_PULSE_SPEED);

  ctx.font = state.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const block of state.blocks.values()) {
    const node = nodes.find((n) => n.id === block.nodeId);
    if (!node) continue;

    const bounds = getBlockBounds(node, block, state.blockWidth);
    const hasHighlights = block.highlightedWords.size > 0;
    const blockAge = now - block.createdAt;

    // Compute per-line taper: lines near the vertical center of the block
    // shift toward the neighbor, lines at edges stay put → organic rounded shape
    const lineCount = block.lines.length;
    const nbr = block.neighbor;
    const pullX = nbr ? nbr.dirX * WORD_PULL * nbr.strength : 0;

    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      const line = block.lines[lineIdx]!;

      const lineDelay = lineIdx * FADE_STAGGER_PER_LINE;
      const lineAge = blockAge - lineDelay;
      const fadeProgress = Math.min(1, Math.max(0, lineAge / FADE_IN_DURATION));
      if (fadeProgress <= 0) continue;

      // Taper: bell curve centered at middle of block → middle lines shift most
      const t = lineCount > 1 ? lineIdx / (lineCount - 1) : 0.5;
      const bellCurve = Math.sin(t * Math.PI); // 0 at edges, 1 at center
      const taperShift = nbr
        ? nbr.dirX * TAPER_AMOUNT * nbr.strength * bellCurve
        : 0;

      const lineX = bounds.x + taperShift;
      const lineY = bounds.y + line.relY;

      if (!hasHighlights) {
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.7 * fadeProgress;
        ctx.fillText(line.text, lineX, lineY);
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
            ctx.fillText(token, xOffset + pullX * bellCurve, lineY);
          } else {
            ctx.fillStyle = block.color;
            ctx.globalAlpha = 0.7 * fadeProgress;
            ctx.fillText(token, xOffset, lineY);
          }

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
