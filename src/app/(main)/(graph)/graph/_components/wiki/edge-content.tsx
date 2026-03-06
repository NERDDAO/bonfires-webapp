"use client";

import Attributes from "./attributes";
import type { WikiEdgeData } from "./wiki-panel-utils";
import { getNodeDisplayName } from "./wiki-panel-utils";

/**
 * Displays wiki content for an edge (relationship).
 */
export function EdgeContent({
  edge,
  onNodeSelect,
  getRelatedNodeTitle,
}: {
  edge: WikiEdgeData;
  onNodeSelect: (nodeId: string) => void;
  getRelatedNodeTitle?: (nodeId: string) => string | undefined;
}) {
  const fact =
    typeof edge.fact === "string"
      ? edge.fact
      : typeof edge.attributes?.["fact"] === "string"
        ? edge.attributes["fact"]
        : undefined;

  return (
    <div className="space-y-4">
      {/* Connection */}
      <section>
        <h3 className="font-medium mb-2">Connection</h3>
        <div className="flex flex-col items-center gap-2 text-sm">
          <button
            onClick={() => {
              const id = edge.source.replace(/^n:/, "");
              onNodeSelect(id);
            }}
            className="link text-base-content"
          >
            {getNodeDisplayName(edge.source, getRelatedNodeTitle)}
          </button>
          <span className="text-base-content/50 rotate-90">→</span>
          <button
            onClick={() => {
              const id = edge.target.replace(/^n:/, "");
              onNodeSelect(id);
            }}
            className="link text-base-content"
          >
            {getNodeDisplayName(edge.target, getRelatedNodeTitle)}
          </button>
        </div>
      </section>

      {/* Strength */}
      {typeof edge.strength === "number" && (
        <section>
          <h3 className="font-medium mb-2">Strength</h3>
          <div className="flex items-center gap-2 text-sm">
            <progress
              className="progress progress-primary w-32"
              value={edge.strength * 100}
              max="100"
            />
            <span className="text-sm">{(edge.strength * 100).toFixed(0)}%</span>
          </div>
        </section>
      )}

      {/* Fact */}
      {fact && (
        <section>
          <h3 className="font-medium mb-2">Fact</h3>
          <p className="text-sm leading-relaxed">{fact}</p>
        </section>
      )}

      {/* Attributes */}
      {edge.attributes && Object.keys(edge.attributes).length > 0 && (
        <section>
          <h3 className="font-medium mb-2">Attributes</h3>
          <Attributes attributes={edge.attributes} />
        </section>
      )}
    </div>
  );
}
