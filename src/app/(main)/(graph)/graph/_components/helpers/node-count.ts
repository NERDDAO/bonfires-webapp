import type { GraphElement } from "@/lib/utils/sigma-adapter";

export function getNodeCount(elements: GraphElement[]): {
  nodeCount: number;
  edgeCount: number;
} {
  const nodes = elements.filter(
    (el) =>
      el.data &&
      !(
        "source" in el.data &&
        "target" in el.data &&
        el.data.source != null &&
        el.data.target != null
      )
  ).length;
  const edges = elements.filter(
    (el) =>
      el.data &&
      "source" in el.data &&
      "target" in el.data &&
      el.data.source != null &&
      el.data.target != null
  ).length;
  return { nodeCount: nodes, edgeCount: edges };
}
