"use client";

import React from "react";

import type { WikiEdgeData, WikiNodeData } from "./wiki-panel-utils";
import { formatAttributeValue, formatLabel } from "./wiki-panel-utils";
import Attributes from "./attributes";

export interface EdgeContentProps {
  edge: WikiEdgeData;
  edgeSourceNode: WikiNodeData | null;
  edgeTargetNode: WikiNodeData | null;
  onNodeSelect: (nodeId: string) => void;
  getRelatedNodeTitle?: (nodeId: string) => string | undefined;
}

/**
 * Displays wiki content for an edge (relationship).
 */
function getNodeDisplayName(
  node: WikiNodeData | null,
  fallbackId: string,
  getRelatedNodeTitle?: (nodeId: string) => string | undefined
): string {
  if (node?.name) return node.name;
  if (node?.label) return node.label;
  const cleanId = fallbackId.replace(/^n:/, "");
  return getRelatedNodeTitle?.(cleanId) ?? fallbackId;
}

export function EdgeContent({
  edge,
  edgeSourceNode,
  edgeTargetNode,
  onNodeSelect,
  getRelatedNodeTitle,
}: EdgeContentProps) {
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
        <h3 className="font-medium mb-2">
          Connection
        </h3>
        <div className="flex flex-col items-center gap-2 text-sm">
          <button
            onClick={() => {
              const id = edgeSourceNode?.uuid ?? edge.source.replace(/^n:/, "");
              onNodeSelect(id);
            }}
            className="link text-base-content"
          >
            {getNodeDisplayName(
              edgeSourceNode,
              edge.source,
              getRelatedNodeTitle
            )}
          </button>
          <span className="text-base-content/50 rotate-90">→</span>
          <button
            onClick={() => {
              const id = edgeTargetNode?.uuid ?? edge.target.replace(/^n:/, "");
              onNodeSelect(id);
            }}
            className="link text-base-content"
          >
            {getNodeDisplayName(
              edgeTargetNode,
              edge.target,
              getRelatedNodeTitle
            )}
          </button>
        </div>
      </section>

      {/* Strength */}
      {typeof edge.strength === "number" && (
        <section>
          <h3 className="font-medium mb-2">
            Strength
          </h3>
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
          <h3 className="font-medium mb-2">
            Fact
          </h3>
          <p className="text-sm leading-relaxed">{fact}</p>
        </section>
      )}

      {/* Attributes */}
      {edge.attributes && Object.keys(edge.attributes).length > 0 && (
        <section>
          <h3 className="font-medium mb-2">
            Attributes
          </h3>
          <Attributes attributes={edge.attributes} />
        </section>
      )}
    </div>
  );
}
