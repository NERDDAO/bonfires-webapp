/**
 * Text block renderer: clean pretext paragraphs at each node.
 * During drag, shared words in nearby blocks pull toward the dragged node
 * like water droplets attracted to a magnet — per-word physics.
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
  relY: number;
};

type NodeTextBlock = {
  nodeId: string;
  color: string;
  prepared: PreparedTextWithSegments;
  lines: PositionedLine[];
  blockHeight: number;
  wordMap: Map<string, number>;
  createdAt: number;
};

export type WordCloudState = {
  blocks: Map<string, NodeTextBlock>;
  font: string;
  blockWidth: number;
  lineHeight: number;
  _tokenWidths: Map<string, number>;
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
const MAGNET_RANGE = 300;
const MAGNET_PULL = 30;

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
      createdAt: now,
    });
  }

  return {
    blocks,
    font: FONT,
    blockWidth: BLOCK_WIDTH,
    lineHeight: LINE_HEIGHT,
    _tokenWidths: new Map(),
    _createdAt: now,
  };
}

// --- Block bounds ---

function getBlockBounds(
  node: ViewNode,
  block: NodeTextBlock,
  blockWidth: number,
): BoundingBox {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  return {
    x: cx - blockWidth / 2,
    y: cy - block.blockHeight / 2,
    w: blockWidth,
    h: block.blockHeight,
  };
}

// --- Cached token width ---

function getTokenWidth(
  token: string,
  ctx: CanvasRenderingContext2D,
  cache: Map<string, number>,
): number {
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
  draggedNodeId: string | null,
): void {
  const now = performance.now();

  // If dragging, compute which words in OTHER blocks are shared with the dragged block
  let magnetNode: ViewNode | null = null;
  let magnetBlock: NodeTextBlock | null = null;
  let magnetSharedByBlock: Map<string, Set<string>> | null = null;

  if (draggedNodeId) {
    magnetNode = nodes.find((n) => n.id === draggedNodeId) ?? null;
    magnetBlock = state.blocks.get(draggedNodeId) ?? null;

    if (magnetNode && magnetBlock) {
      magnetSharedByBlock = new Map();
      for (const [otherId, otherBlock] of state.blocks) {
        if (otherId === draggedNodeId) continue;
        const otherNode = nodes.find((n) => n.id === otherId);
        if (!otherNode) continue;
        const dist = Math.hypot(
          (otherNode.x ?? 0) - (magnetNode.x ?? 0),
          (otherNode.y ?? 0) - (magnetNode.y ?? 0),
        );
        if (dist > MAGNET_RANGE) continue;

        const shared = findSharedWords(magnetBlock.wordMap, otherBlock.wordMap);
        if (shared.size > 0) {
          magnetSharedByBlock.set(otherId, shared);
        }
      }
    }
  }

  ctx.font = state.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const block of state.blocks.values()) {
    const node = nodes.find((n) => n.id === block.nodeId);
    if (!node) continue;

    const bounds = getBlockBounds(node, block, state.blockWidth);
    const blockAge = now - block.createdAt;

    // Magnet effect: is this block near the dragged node?
    const sharedWithMagnet = magnetSharedByBlock?.get(block.nodeId);
    let magnetDirX = 0;
    let magnetDirY = 0;
    let magnetStrength = 0;

    if (sharedWithMagnet && magnetNode) {
      const dx = (magnetNode.x ?? 0) - (node.x ?? 0);
      const dy = (magnetNode.y ?? 0) - (node.y ?? 0);
      const dist = Math.hypot(dx, dy);
      if (dist > 0.1) {
        magnetDirX = dx / dist;
        magnetDirY = dy / dist;
        magnetStrength = Math.max(0, 1 - dist / MAGNET_RANGE);
      }
    }

    for (let lineIdx = 0; lineIdx < block.lines.length; lineIdx++) {
      const line = block.lines[lineIdx]!;

      const lineDelay = lineIdx * FADE_STAGGER_PER_LINE;
      const lineAge = blockAge - lineDelay;
      const fadeProgress = Math.min(1, Math.max(0, lineAge / FADE_IN_DURATION));
      if (fadeProgress <= 0) continue;

      const lineX = bounds.x;
      const lineY = bounds.y + line.relY;

      if (!sharedWithMagnet) {
        // No magnet interaction — draw entire line fast
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.7 * fadeProgress;
        ctx.fillText(line.text, lineX, lineY);
      } else {
        // Per-word magnet: shared words pull toward dragged node
        const words = line.text.split(/(\s+)/);
        let xOffset = lineX;

        for (const token of words) {
          const isWord = /\S/.test(token);
          const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");
          const isShared = isWord && sharedWithMagnet.has(normalized);

          const tokenW = getTokenWidth(token, ctx, state._tokenWidths);

          if (isShared && magnetStrength > 0) {
            // Pull this word toward the magnet
            const pull = MAGNET_PULL * magnetStrength;
            const wordPullX = magnetDirX * pull;
            const wordPullY = magnetDirY * pull * 0.5; // less vertical pull

            ctx.fillStyle = HIGHLIGHT_COLOR;
            ctx.globalAlpha = (0.8 + 0.2 * magnetStrength) * fadeProgress;
            ctx.fillText(token, xOffset + wordPullX, lineY + wordPullY);
          } else {
            ctx.fillStyle = block.color;
            ctx.globalAlpha = 0.7 * fadeProgress;
            ctx.fillText(token, xOffset, lineY);
          }

          xOffset += tokenW;
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
