"use client";

import { useEffect, useRef } from "react";

import * as d3 from "d3";

// Node size tier 1–5 (1 = smallest, 5 = largest). Used for radius.
const RADIUS_BY_SIZE: Record<number, number> = {
  1: 8,
  2: 10,
  3: 12,
  4: 24,
  5: 28,
};

// Static nodes: web3 conference–related terms with id, label, and size (1–5).
const NODES_DATA: { id: string; label: string; size: number }[] = [
  { id: "eth", label: "ETH", size: 5 },
  { id: "ethereum", label: "Ethereum", size: 5 },
  { id: "web3", label: "Web3", size: 5 },
  { id: "conference", label: "Conference", size: 4 },
  { id: "boulder", label: "Boulder", size: 4 },
  { id: "defi", label: "DeFi", size: 3 },
  { id: "dao", label: "DAO", size: 3 },
  { id: "smart-contracts", label: "Smart Contracts", size: 3 },
  { id: "nft", label: "NFT", size: 3 },
  { id: "hackathon", label: "Hackathon", size: 3 },
  { id: "workshop", label: "Workshop", size: 3 },
  { id: "governance", label: "Governance", size: 3 },
  { id: "layer2", label: "Layer 2", size: 3 },
  { id: "community", label: "Community", size: 3 },
  { id: "wallet", label: "Wallet", size: 2 },
  { id: "builders", label: "Builders", size: 2 },
  { id: "zk", label: "ZK", size: 2 },
  { id: "rollups", label: "Rollups", size: 2 },
  { id: "networking", label: "Networking", size: 2 },
  { id: "devcon", label: "Devcon", size: 2 },
  { id: "eip", label: "EIP", size: 1 },
  { id: "dapp", label: "DApp", size: 1 },
  { id: "token", label: "Token", size: 1 },
  { id: "staking", label: "Staking", size: 1 },
  { id: "grants", label: "Grants", size: 1 },
];

// Links by node id (source -> target). Interrelation defines edges.
const LINKS_DATA: { source: string; target: string }[] = [
  { source: "eth", target: "ethereum" },
  { source: "eth", target: "smart-contracts" },
  { source: "eth", target: "defi" },
  { source: "eth", target: "dao" },
  { source: "eth", target: "nft" },
  { source: "ethereum", target: "web3" },
  { source: "ethereum", target: "layer2" },
  { source: "web3", target: "conference" },
  { source: "conference", target: "boulder" },
  { source: "conference", target: "hackathon" },
  { source: "conference", target: "workshop" },
  { source: "conference", target: "networking" },
  { source: "conference", target: "community" },
  { source: "boulder", target: "hackathon" },
  { source: "boulder", target: "community" },
  { source: "defi", target: "dao" },
  { source: "defi", target: "token" },
  { source: "defi", target: "staking" },
  { source: "defi", target: "smart-contracts" },
  { source: "dao", target: "governance" },
  { source: "dao", target: "token" },
  { source: "smart-contracts", target: "dapp" },
  { source: "smart-contracts", target: "nft" },
  { source: "layer2", target: "rollups" },
  { source: "layer2", target: "zk" },
  { source: "rollups", target: "zk" },
  { source: "hackathon", target: "builders" },
  { source: "hackathon", target: "grants" },
  { source: "workshop", target: "builders" },
  { source: "community", target: "builders" },
  { source: "ethereum", target: "eip" },
  { source: "devcon", target: "conference" },
  { source: "wallet", target: "eth" },
  { source: "wallet", target: "dapp" },
];

type D3Node = (typeof NODES_DATA)[0] & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  /** Rest position after layout; used by gentle motion spring. */
  x0?: number;
  y0?: number;
};
type D3Link = { source: D3Node; target: D3Node };

const WIDTH = 600 * 1.5;
const HEIGHT = 600 * 1.5;

/** Alpha below which we consider the layout phase "settled". */
const LAYOUT_ALPHA_MIN = 0.001;

/** Gentle motion: spring strength toward rest position (weak so nodes can drift). */
const SPRING_STRENGTH = 0.006;
/** Gentle motion: constant drift speed per node so they visibly move. */
const DRIFT_STRENGTH = 0.15;
/** Gentle motion: how fast each node's drift direction rotates (radians per ms). */
const DRIFT_ROTATION_SPEED = 0.00015;
/** Gentle motion: max random impulse per axis per tick. */
const RANDOM_STRENGTH = 0.06;
/** Gentle motion: velocity damping per tick (0–1). */
const DAMPING = 0.96;

/** Hash a string to a number in [0, 1). */
function hashToFloat(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

/**
 * Custom force: weak spring to rest position + per-node time-varying drift (so
 * nodes visibly move and never settle), small random nudge, and damping.
 */
function gentleMotionForce(
  nodes: D3Node[],
  springStrength: number,
  driftStrength: number,
  driftRotationSpeed: number,
  randomStrength: number,
  damping: number
): d3.Force<D3Node, undefined> {
  const baseAngleByNode = new Map<D3Node, number>();
  const speedByNode = new Map<D3Node, number>();
  for (const node of nodes) {
    baseAngleByNode.set(node, hashToFloat(node.id) * 2 * Math.PI);
    speedByNode.set(node, 0.7 + hashToFloat(node.id + "x") * 0.6);
  }
  return function () {
    const t =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    for (const node of nodes) {
      const x0 = node.x0 ?? node.x ?? 0;
      const y0 = node.y0 ?? node.y ?? 0;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const angle =
        (baseAngleByNode.get(node)! + t * driftRotationSpeed) % (2 * Math.PI);
      const speed = speedByNode.get(node)!;
      const driftVx = Math.cos(angle) * driftStrength * speed;
      const driftVy = Math.sin(angle) * driftStrength * speed;

      const vx = (node.vx ?? 0) * damping;
      const vy = (node.vy ?? 0) * damping;

      node.vx =
        vx +
        (x0 - x) * springStrength +
        driftVx +
        (Math.random() - 0.5) * randomStrength;
      node.vy =
        vy +
        (y0 - y) * springStrength +
        driftVy +
        (Math.random() - 0.5) * randomStrength;
    }
  };
}

/** Keep node positions inside canvas (with padding from radius). */
function clampNodesToBounds(nodes: D3Node[]) {
  for (const node of nodes) {
    const r = RADIUS_BY_SIZE[node.size] ?? 20;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    node.x = Math.max(r, Math.min(WIDTH - r, x));
    node.y = Math.max(r, Math.min(HEIGHT - r, y));
  }
}

function getGraphColors() {
  return {
    linkStroke: "rgba(95, 95, 95, 1)",
    nodeFill: "rgb(179, 179, 179)",
    nodeStroke: "rgb(179, 179, 179)",
    labelFill: "rgb(246, 246, 246)",
  };
}

function draw(
  ctx: CanvasRenderingContext2D,
  nodes: D3Node[],
  links: D3Link[],
  width: number,
  height: number,
  colors: ReturnType<typeof getGraphColors>
) {
  ctx.clearRect(0, 0, width, height);

  // Links
  ctx.strokeStyle = colors.linkStroke;
  ctx.lineWidth = 1.5;
  for (const link of links) {
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  // Nodes (circles + labels)
  for (const node of nodes) {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const r = RADIUS_BY_SIZE[node.size] ?? 20;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = colors.nodeFill;
    ctx.fill();
    ctx.strokeStyle = colors.nodeStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const fontSize = node.size >= 4 ? 11 : node.size >= 2 ? 10 : 9;
    const fontWeight = node.size >= 4 ? "600" : "500";
    ctx.font = `${fontWeight} ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = colors.labelFill;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelY = y + r + 4;
    ctx.fillText(node.label, x, labelY);
  }
}

export default function StaticGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const nodes: D3Node[] = NODES_DATA.map((d) => ({ ...d }));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links: D3Link[] = LINKS_DATA.map(({ source, target }) => ({
      source: nodeById.get(source)!,
      target: nodeById.get(target)!,
    }));

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const colors = getGraphColors();

    const simulation = d3.forceSimulation(nodes);

    // ——— Phase 1: layout (hidden). Run until settled, no canvas updates. ———
    simulation
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => (d as D3Node).id)
          .distance(80)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collision",
        d3
          .forceCollide<D3Node>()
          .radius((d) => (RADIUS_BY_SIZE[d.size] ?? 20) + 8)
      );

    while (simulation.alpha() > LAYOUT_ALPHA_MIN) {
      simulation.tick();
    }

    // Store rest position for each node so gentle motion can spring back.
    for (const node of nodes) {
      node.x0 = node.x;
      node.y0 = node.y;
    }

    // ——— Phase 2: gentle motion only — weak spring to rest + small random + damping. ———
    simulation
      .force("link", null)
      .force("charge", null)
      .force("center", null)
      .force("collision", null)
      .force(
        "gentle",
        gentleMotionForce(
          nodes,
          SPRING_STRENGTH,
          DRIFT_STRENGTH,
          DRIFT_ROTATION_SPEED,
          RANDOM_STRENGTH,
          DAMPING
        )
      )
      .alphaTarget(0.2)
      .on("tick", () => {
        clampNodesToBounds(nodes);
        draw(ctx, nodes, links, WIDTH, HEIGHT, colors);
      })
      .restart();

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div
      className="relative"
      style={{ minHeight: `max(100dvh, ${HEIGHT}px)` }}
    >
      <figure className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block w-full text-base-content"
          style={{ width: WIDTH, height: HEIGHT }}
          aria-label="Force-directed graph of Web3 conference terms"
        />
      </figure>
    </div>
  );
}
