/**
 * synthesizeEpisodicEdges Tests
 *
 * Verifies that synthetic MENTIONS edges are correctly created from the
 * `episodes` metadata on EntityEdge objects.
 */
import { synthesizeEpisodicEdges } from "@/lib/utils/graph-utils";

import type { GraphEdge } from "@/types/graph";

function makeEdge(
  source: string,
  target: string,
  episodes?: string[]
): GraphEdge {
  return {
    source_node_uuid: source,
    target_node_uuid: target,
    type: "related_to",
    ...(episodes !== undefined ? { episodes } : {}),
  };
}

describe("synthesizeEpisodicEdges", () => {
  it("creates MENTIONS edges from episode metadata when episode node exists", () => {
    const edges: GraphEdge[] = [makeEdge("entityA", "entityB", ["ep1"])];
    const nodeIds = new Set(["entityA", "entityB", "ep1"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    expect(result).toHaveLength(2);
    expect(result[0]!.data).toMatchObject({
      source: "n:ep1",
      target: "n:entityA",
      relationship: "MENTIONS",
    });
    expect(result[1]!.data).toMatchObject({
      source: "n:ep1",
      target: "n:entityB",
      relationship: "MENTIONS",
    });
  });

  it("skips episodes not present in nodeIds", () => {
    const edges: GraphEdge[] = [makeEdge("entityA", "entityB", ["ep-missing"])];
    const nodeIds = new Set(["entityA", "entityB"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    expect(result).toHaveLength(0);
  });

  it("deduplicates edges when multiple entity edges reference the same episode and entity", () => {
    const edges: GraphEdge[] = [
      makeEdge("entityA", "entityB", ["ep1"]),
      makeEdge("entityA", "entityC", ["ep1"]),
    ];
    const nodeIds = new Set(["entityA", "entityB", "entityC", "ep1"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    // ep1→entityA (once, deduplicated), ep1→entityB, ep1→entityC = 3 edges
    expect(result).toHaveLength(3);
    const targets = result.map((e) => e.data.target);
    expect(targets).toContain("n:entityA");
    expect(targets).toContain("n:entityB");
    expect(targets).toContain("n:entityC");

    // All sources should be the episode
    const sources = result.map((e) => e.data.source);
    expect(sources.every((s) => s === "n:ep1")).toBe(true);
  });

  it("skips edges with no episodes field", () => {
    const edges: GraphEdge[] = [makeEdge("entityA", "entityB")];
    const nodeIds = new Set(["entityA", "entityB"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    expect(result).toHaveLength(0);
  });

  it("skips edges with an empty episodes array", () => {
    const edges: GraphEdge[] = [makeEdge("entityA", "entityB", [])];
    const nodeIds = new Set(["entityA", "entityB"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    expect(result).toHaveLength(0);
  });

  it("reads episodes from nested properties object", () => {
    const edge: GraphEdge = {
      source_node_uuid: "entityA",
      target_node_uuid: "entityB",
      type: "related_to",
      properties: { episodes: ["ep1"] },
    };
    const nodeIds = new Set(["entityA", "entityB", "ep1"]);

    const result = synthesizeEpisodicEdges([edge], nodeIds);

    expect(result).toHaveLength(2);
    expect(result[0]!.data.source).toBe("n:ep1");
  });

  it("strips n: prefix from episode UUIDs", () => {
    const edges: GraphEdge[] = [
      makeEdge("entityA", "entityB", ["n:ep-prefixed"]),
    ];
    const nodeIds = new Set(["entityA", "entityB", "ep-prefixed"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    expect(result).toHaveLength(2);
    expect(result[0]!.data.source).toBe("n:ep-prefixed");
    expect(result[0]!.data.target).toBe("n:entityA");
  });

  it("handles multiple episodes on a single edge", () => {
    const edges: GraphEdge[] = [makeEdge("entityA", "entityB", ["ep1", "ep2"])];
    const nodeIds = new Set(["entityA", "entityB", "ep1", "ep2"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    // ep1→entityA, ep1→entityB, ep2→entityA, ep2→entityB = 4
    expect(result).toHaveLength(4);
  });

  it("generates unique edge IDs with ep: prefix", () => {
    const edges: GraphEdge[] = [makeEdge("entityA", "entityB", ["ep1"])];
    const nodeIds = new Set(["entityA", "entityB", "ep1"]);

    const result = synthesizeEpisodicEdges(edges, nodeIds);

    for (const edge of result) {
      expect(edge.data.id).toMatch(/^ep:/);
    }
    const ids = result.map((e) => e.data.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
