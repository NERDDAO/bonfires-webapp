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
  /** Drag velocity tracking for blob deformation */
  _dragPrevPos: { x: number; y: number } | null;
  _dragVelocity: { vx: number; vy: number };
  /** Cached similarity results: "nodeA:nodeB" → similarities (stable until blocks rebuild) */
  _similarityCache: Map<string, { ab: Map<string, WordSimilarity>; ba: Map<string, WordSimilarity> }>;
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
const DRAG_PULL = 12;     // gentle pull when dragging (clearing takes priority)

// Blob deformation: droplet — center leads, edges trail + pinch inward
const BLOB_MAX_OFFSET = 14;   // max px a trailing line can lag
const BLOB_VELOCITY_DECAY = 0.85; // velocity damping per frame
const BLOB_VELOCITY_SCALE = 0.6;  // drag direction deformation
const BLOB_PINCH_SCALE = 0.4;    // perpendicular pinch toward drag axis

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
    _dragPrevPos: null,
    _dragVelocity: { vx: 0, vy: 0 },
    _similarityCache: new Map(),
  };
}

// --- Compute pairwise effects ---

function computePairEffects(
  state: WordCloudState,
  nodes: ViewNode[],
  draggedNodeId: string | null,
  selectedNodeId: string | null = null,
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

      // Fuzzy n-gram matching with caching (word maps are stable between rebuilds)
      const cacheKey = ni.id < nj.id ? `${ni.id}:${nj.id}` : `${nj.id}:${ni.id}`;
      let cached = state._similarityCache.get(cacheKey);
      if (!cached) {
        const ab = findSimilarWords(a.wordMap, b.wordMap);
        const ba = findSimilarWords(b.wordMap, a.wordMap);
        cached = ni.id < nj.id ? { ab, ba } : { ab: ba, ba: ab };
        state._similarityCache.set(cacheKey, cached);
      }
      const aSimilarities = ni.id < nj.id ? cached.ab : cached.ba;
      const bSimilarities = ni.id < nj.id ? cached.ba : cached.ab;

      if (aSimilarities.size === 0 && bSimilarities.size === 0) continue;

      const proximity = Math.max(0, 1 - dist / PASSIVE_RANGE);
      const dx = bx - ax;
      const dy = by - ay;
      const nx = dx / dist;
      const ny = dy / dist;

      const isDragPair = draggedNodeId === ni.id || draggedNodeId === nj.id;
      const isSelectedPair = !isDragPair && (selectedNodeId === ni.id || selectedNodeId === nj.id);
      const strength = isDragPair ? proximity * 1.5 : isSelectedPair ? proximity * 0.8 : proximity;

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
  selectedNodeId: string | null = null,
): void {
  const now = performance.now();

  // Recompute pair effects (always — includes drag boost when applicable)
  const hash =
    nodes.reduce((h, n) => {
      if (!state.blocks.has(n.id)) return h;
      return (h * 31 + ((n.x ?? 0) * 100 | 0) + ((n.y ?? 0) * 100 | 0)) | 0;
    }, 0) + (draggedNodeId ? 1 : 0) + (selectedNodeId ? 2 : 0);

  if (hash !== state._lastPositionHash) {
    state._lastPositionHash = hash;
    computePairEffects(state, nodes, draggedNodeId, selectedNodeId);
  }

  // Build node lookup map once (avoids O(n) find() per block)
  const nodeMap = new Map<string, ViewNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Track drag velocity for blob deformation
  if (draggedNodeId) {
    const dragNode = nodeMap.get(draggedNodeId);
    if (dragNode) {
      const cx = dragNode.x ?? 0;
      const cy = dragNode.y ?? 0;
      if (state._dragPrevPos) {
        const rawVx = cx - state._dragPrevPos.x;
        const rawVy = cy - state._dragPrevPos.y;
        // Blend with previous velocity for smoothness
        state._dragVelocity.vx = state._dragVelocity.vx * 0.3 + rawVx * 0.7;
        state._dragVelocity.vy = state._dragVelocity.vy * 0.3 + rawVy * 0.7;
      }
      state._dragPrevPos = { x: cx, y: cy };
    }
  } else {
    // Decay velocity after drag ends (spring-back)
    state._dragVelocity.vx *= BLOB_VELOCITY_DECAY;
    state._dragVelocity.vy *= BLOB_VELOCITY_DECAY;
    if (Math.abs(state._dragVelocity.vx) < 0.1 && Math.abs(state._dragVelocity.vy) < 0.1) {
      state._dragVelocity.vx = 0;
      state._dragVelocity.vy = 0;
    }
    state._dragPrevPos = null;
  }

  ctx.font = state.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Precompute proximity effects: nearby blocks dim + push away from focus node
  const CLEAR_RADIUS = 200;
  const REPULSE_STRENGTH = 18; // max px to push nearby blocks away (gentle)
  let proximityDim: Map<string, number> | null = null;
  let proximityPush: Map<string, { dx: number; dy: number }> | null = null;
  const focusNodeId = draggedNodeId ?? selectedNodeId;
  if (focusNodeId) {
    const focusNode = nodeMap.get(focusNodeId);
    if (focusNode) {
      proximityDim = new Map();
      proximityPush = new Map();
      const sx = focusNode.x ?? 0;
      const sy = focusNode.y ?? 0;
      for (const block of state.blocks.values()) {
        if (block.nodeId === focusNodeId) continue;
        const other = nodeMap.get(block.nodeId);
        if (!other) continue;
        const ox = other.x ?? 0;
        const oy = other.y ?? 0;
        const dist = Math.hypot(ox - sx, oy - sy);
        if (dist < CLEAR_RADIUS && dist > 0.1) {
          const closeness = 1 - dist / CLEAR_RADIUS;
          // Dim (keep readable — don't go below 0.4)
          const minAlpha = draggedNodeId ? 0.4 : 0.45;
          proximityDim.set(block.nodeId, minAlpha + (1 - minAlpha) * (1 - closeness));
          // Push away from focus node (stronger when closer)
          const pushMag = REPULSE_STRENGTH * closeness * closeness;
          const nx = (ox - sx) / dist;
          const ny = (oy - sy) / dist;
          proximityPush.set(block.nodeId, { dx: nx * pushMag, dy: ny * pushMag });
        }
      }
    }
  }

  for (const block of state.blocks.values()) {
    const node = nodeMap.get(block.nodeId);
    if (!node) continue;

    const bounds = getBlockBounds(node, block, state.blockWidth);
    // Apply repulsion push to block position
    const push = proximityPush?.get(block.nodeId);
    if (push) {
      bounds.x += push.dx;
      bounds.y += push.dy;
    }
    const blockAge = now - block.createdAt;
    const effects = state._pairEffects.get(block.nodeId);
    const isDragged = block.nodeId === draggedNodeId;
    const isSelected = block.nodeId === selectedNodeId;

    // Collect per-word pull vectors scaled by n-gram similarity
    const wordPulls = new Map<string, { px: number; py: number; maxSim: number }>();
    if (effects) {
      for (const effect of effects) {
        // Selected nodes get a gentler pull than dragged ones
        const pullBase = isDragged || effect.otherNodeId === draggedNodeId
          ? DRAG_PULL
          : isSelected || effect.otherNodeId === selectedNodeId
            ? PASSIVE_PULL * 2  // slightly stronger than passive, much gentler than drag
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

    // Subtle glow behind selected block
    if (isSelected && block.lines.length > 0) {
      const glowX = bounds.x + state.blockWidth / 2;
      const glowY = bounds.y + block.blockHeight / 2;
      const glowR = Math.max(state.blockWidth, block.blockHeight) * 0.6;
      const grad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
      grad.addColorStop(0, "rgba(245, 87, 42, 0.12)");
      grad.addColorStop(1, "rgba(245, 87, 42, 0)");
      ctx.fillStyle = grad;
      ctx.globalAlpha = 1;
      ctx.fillRect(glowX - glowR, glowY - glowR, glowR * 2, glowR * 2);
    }

    // Blob deformation: droplet — center leads, edges trail + pinch inward
    const { vx, vy } = state._dragVelocity;
    const speed = Math.hypot(vx, vy);
    const hasVelocity = isDragged && speed > 0.5;
    const lineCount = block.lines.length;
    const midLine = (lineCount - 1) / 2;
    // Normalized drag direction and perpendicular (for pinching)
    const dirX = hasVelocity ? vx / speed : 0;
    const dirY = hasVelocity ? vy / speed : 0;
    // Perpendicular to drag direction (used to pinch trailing lines inward)
    const perpX = -dirY;
    const perpY = dirX;

    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      const line = block.lines[lineIdx]!;

      const lineDelay = lineIdx * FADE_STAGGER_PER_LINE;
      const lineAge = blockAge - lineDelay;
      const fadeProgress = Math.min(1, Math.max(0, lineAge / FADE_IN_DURATION));
      if (fadeProgress <= 0) continue;

      // Droplet: center lines follow drag fully, edge lines trail + pinch
      let blobDx = 0;
      let blobDy = 0;
      if (hasVelocity && lineCount > 1) {
        // 0 at center, 1 at edges
        const edgeness = Math.abs(lineIdx - midLine) / midLine;
        // Center follows drag, edges trail (quadratic falloff)
        const followFactor = 1 - edgeness * edgeness;
        // Drag-direction offset: center moves with drag, edges stay behind
        const dragOffset = speed * BLOB_VELOCITY_SCALE * followFactor;
        blobDx = dirX * dragOffset;
        blobDy = dirY * dragOffset;

        // Pinch: trailing lines contract toward center axis
        // Each line's perpendicular position relative to block center
        const lineRelY = (lineIdx - midLine) / midLine; // -1..1
        const pinchAmount = speed * BLOB_PINCH_SCALE * edgeness * edgeness;
        // Pull toward the drag axis (contract perpendicular offset)
        blobDx -= perpX * lineRelY * pinchAmount;
        blobDy -= perpY * lineRelY * pinchAmount;

        // Clamp total offset
        const mag = Math.hypot(blobDx, blobDy);
        if (mag > BLOB_MAX_OFFSET) {
          const scale = BLOB_MAX_OFFSET / mag;
          blobDx *= scale;
          blobDy *= scale;
        }
      }

      const lineX = bounds.x + blobDx;
      const lineY = bounds.y + line.relY + blobDy;

      // Selected block gets a brightness boost; nearby blocks dim to clear visual space
      const dimFactor = proximityDim?.get(block.nodeId) ?? 1;
      const baseAlpha = isSelected ? 1.0 : 0.7 * dimFactor;

      if (!hasEffects) {
        ctx.fillStyle = block.color;
        ctx.globalAlpha = baseAlpha * fadeProgress;
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
            ctx.globalAlpha = baseAlpha * fadeProgress;
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
  // Keep animating while blob velocity is decaying
  if (Math.abs(state._dragVelocity.vx) > 0.1 || Math.abs(state._dragVelocity.vy) > 0.1) {
    return true;
  }
  const now = performance.now();
  for (const block of state.blocks.values()) {
    const totalDuration = block.lines.length * FADE_STAGGER_PER_LINE + FADE_IN_DURATION;
    if (now - block.createdAt < totalDuration) return true;
  }
  return false;
}
