/**
 * Text block renderer: clean pretext paragraphs at each node.
 * Always-on: shared words between nearby blocks gently pull toward each other.
 * On drag: effect intensifies — both the held node's words and neighbor words
 * pull harder toward their matches, like magnets strengthening.
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
  type WordSimilarity,
  extractNodeText,
  tokenize,
  findSimilarWords,
} from "./word-cloud-utils";

// --- Types ---

type PositionedLine = {
  text: string;
  width: number;
  relY: number;
};

type PairEffect = {
  otherNodeId: string;
  dirX: number;
  dirY: number;
  strength: number; // 0..1
  /** word → similarity score (0..1) from n-gram Jaccard */
  wordSimilarities: Map<string, number>;
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
  /** Recomputed each frame: per-block pair effects */
  _pairEffects: Map<string, PairEffect[]>;
  _lastPositionHash: number;
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

const PASSIVE_RANGE = 250;
const PASSIVE_PULL = 8;   // subtle always-on pull
const DRAG_PULL = 30;     // strong pull when dragging

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
    _pairEffects: new Map(),
    _lastPositionHash: 0,
  };
}

// --- Compute pairwise effects ---

function computePairEffects(
  state: WordCloudState,
  nodes: ViewNode[],
  draggedNodeId: string | null,
): void {
  state._pairEffects.clear();

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
      if (dist > PASSIVE_RANGE || dist < 0.1) continue;

      const a = state.blocks.get(ni.id)!;
      const b = state.blocks.get(nj.id)!;

      // Fuzzy n-gram matching: a's words → best match in b (with similarity score)
      const aSimilarities = findSimilarWords(a.wordMap, b.wordMap);
      // Also b → a for the reverse direction
      const bSimilarities = findSimilarWords(b.wordMap, a.wordMap);

      if (aSimilarities.size === 0 && bSimilarities.size === 0) continue;

      const proximity = Math.max(0, 1 - dist / PASSIVE_RANGE);
      const dx = bx - ax;
      const dy = by - ay;
      const nx = dx / dist;
      const ny = dy / dist;

      const isDragPair = draggedNodeId === ni.id || draggedNodeId === nj.id;
      const strength = isDragPair ? proximity * 1.5 : proximity;

      // Build per-word similarity maps
      const aWordSims = new Map<string, number>();
      for (const [word, sim] of aSimilarities) {
        aWordSims.set(word, sim.similarity);
      }
      const bWordSims = new Map<string, number>();
      for (const [word, sim] of bSimilarities) {
        bWordSims.set(word, sim.similarity);
      }

      if (aWordSims.size > 0) {
        if (!state._pairEffects.has(ni.id)) state._pairEffects.set(ni.id, []);
        state._pairEffects.get(ni.id)!.push({
          otherNodeId: nj.id,
          dirX: nx,
          dirY: ny,
          strength,
          wordSimilarities: aWordSims,
        });
      }

      if (bWordSims.size > 0) {
        if (!state._pairEffects.has(nj.id)) state._pairEffects.set(nj.id, []);
        state._pairEffects.get(nj.id)!.push({
          otherNodeId: ni.id,
          dirX: -nx,
          dirY: -ny,
          strength,
          wordSimilarities: bWordSims,
        });
      }
    }
  }
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

  // Recompute pair effects (always — includes drag boost when applicable)
  const hash =
    nodes.reduce((h, n) => {
      if (!state.blocks.has(n.id)) return h;
      return (h * 31 + ((n.x ?? 0) * 100 | 0) + ((n.y ?? 0) * 100 | 0)) | 0;
    }, 0) + (draggedNodeId ? 1 : 0);

  if (hash !== state._lastPositionHash) {
    state._lastPositionHash = hash;
    computePairEffects(state, nodes, draggedNodeId);
  }

  ctx.font = state.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const block of state.blocks.values()) {
    const node = nodes.find((n) => n.id === block.nodeId);
    if (!node) continue;

    const bounds = getBlockBounds(node, block, state.blockWidth);
    const blockAge = now - block.createdAt;
    const effects = state._pairEffects.get(block.nodeId);
    const isDragged = block.nodeId === draggedNodeId;

    // Collect per-word pull vectors scaled by n-gram similarity
    const wordPulls = new Map<string, { px: number; py: number; maxSim: number }>();
    if (effects) {
      for (const effect of effects) {
        const pullBase = isDragged || effect.otherNodeId === draggedNodeId
          ? DRAG_PULL
          : PASSIVE_PULL;

        for (const [word, similarity] of effect.wordSimilarities) {
          const pull = pullBase * effect.strength * similarity;
          const existing = wordPulls.get(word);
          if (existing) {
            existing.px += effect.dirX * pull;
            existing.py += effect.dirY * pull * 0.4;
            existing.maxSim = Math.max(existing.maxSim, similarity);
          } else {
            wordPulls.set(word, {
              px: effect.dirX * pull,
              py: effect.dirY * pull * 0.4,
              maxSim: similarity,
            });
          }
        }
      }
    }

    const hasEffects = wordPulls.size > 0;

    for (let lineIdx = 0; lineIdx < block.lines.length; lineIdx++) {
      const line = block.lines[lineIdx]!;

      const lineDelay = lineIdx * FADE_STAGGER_PER_LINE;
      const lineAge = blockAge - lineDelay;
      const fadeProgress = Math.min(1, Math.max(0, lineAge / FADE_IN_DURATION));
      if (fadeProgress <= 0) continue;

      const lineX = bounds.x;
      const lineY = bounds.y + line.relY;

      if (!hasEffects) {
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.7 * fadeProgress;
        ctx.fillText(line.text, lineX, lineY);
      } else {
        const words = line.text.split(/(\s+)/);
        let xOffset = lineX;

        for (const token of words) {
          const isWord = /\S/.test(token);
          const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");
          const pull = isWord ? wordPulls.get(normalized) : undefined;
          const tokenW = getTokenWidth(token, ctx, state._tokenWidths);

          if (pull) {
            // Color intensity scales with similarity: strong matches = full highlight, weak = blended
            ctx.fillStyle = HIGHLIGHT_COLOR;
            const simBoost = 0.5 + 0.5 * pull.maxSim; // 0.5..1.0
            const intensity = (isDragged ? 1 : 0.85) * simBoost;
            ctx.globalAlpha = intensity * fadeProgress;
            ctx.fillText(token, xOffset + pull.px, lineY + pull.py);
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
