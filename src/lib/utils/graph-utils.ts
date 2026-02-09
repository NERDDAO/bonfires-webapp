/**
 * Graph Utility Functions
 *
 * Pure helpers for graph data transformation shared across components.
 */
import type { GraphData } from "@/types/graph";

import type { GraphElement } from "./sigma-adapter";

/**
 * Synthesize episodic edges (episode -> entity) from the `episodes` metadata
 * on EntityEdge objects.
 *
 * Each EntityEdge carries an `episodes: string[]` of episode UUIDs that
 * contributed to that relationship.  For every episode UUID present in
 * `nodeIds` we emit two synthetic MENTIONS edges: one to the source entity
 * and one to the target entity, deduplicated so each (episode, entity) pair
 * produces at most one edge.
 */
export function synthesizeEpisodicEdges(
  edges: GraphData["edges"],
  nodeIds: Set<string>
): GraphElement[] {
  const seen = new Set<string>();
  const result: GraphElement[] = [];
  let idx = 0;

  const addSyntheticEdge = (episodeId: string, entityId: string) => {
    const key = `${episodeId}|${entityId}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({
      data: {
        id: `ep:${episodeId}-${entityId}-${idx++}`,
        source: `n:${episodeId}`,
        target: `n:${entityId}`,
        label: "mentions",
        relationship: "MENTIONS",
      },
    });
  };

  for (const edge of edges) {
    const rec = edge as Record<string, unknown>;
    const sourceId = stripNodePrefix(
      rec["source"] ??
        rec["source_uuid"] ??
        rec["source_node_uuid"] ??
        rec["from_uuid"] ??
        rec["from"]
    );
    const targetId = stripNodePrefix(
      rec["target"] ??
        rec["target_uuid"] ??
        rec["target_node_uuid"] ??
        rec["to_uuid"] ??
        rec["to"]
    );

    const props = rec["properties"] as Record<string, unknown> | undefined;
    const rawEpisodes = rec["episodes"] ?? props?.["episodes"];
    if (!Array.isArray(rawEpisodes)) continue;

    for (const epUuid of rawEpisodes) {
      const episodeId = stripNodePrefix(epUuid);
      if (!nodeIds.has(episodeId)) continue;

      if (sourceId && nodeIds.has(sourceId)) {
        addSyntheticEdge(episodeId, sourceId);
      }
      if (targetId && nodeIds.has(targetId)) {
        addSyntheticEdge(episodeId, targetId);
      }
    }
  }

  return result;
}

/** Strip the optional `n:` prefix from a node identifier. */
function stripNodePrefix(value: unknown): string {
  return String(value ?? "").replace(/^n:/, "");
}
