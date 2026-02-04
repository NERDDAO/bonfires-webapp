"use client";

import React from "react";
import type { WikiNodeData, WikiEdgeData } from "./wiki-panel-utils";
import { formatAttributeValue, formatLabel } from "./wiki-panel-utils";
import Attributes from "./attributes";

export interface EntityContentProps {
  node: WikiNodeData;
  nodeRelationships: WikiEdgeData[];
  onNodeSelect: (nodeId: string) => void;
  getRelatedNodeTitle?: (nodeId: string) => string | undefined;
}

/**
 * Displays wiki content for an entity node.
 */
export function EntityContent({
  node,
  nodeRelationships,
  onNodeSelect,
  getRelatedNodeTitle,
}: EntityContentProps) {
  return (
    <div className="space-y-4">
      {/* Description */}
      {(node.summary || node.content) && (
        <section>
          <h3 className="text-sm font-semibold text-base-content/70 mb-2">
            Description
          </h3>
          <p className="text-sm text-base-content/80 leading-relaxed">
            {node.summary || node.content}
          </p>
        </section>
      )}

      {/* Relationships */}
      {nodeRelationships.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-base-content/70 mb-2">
            Relationships ({nodeRelationships.length})
          </h3>
          <div className="">
            {nodeRelationships.slice(0, 12).map((rel, idx) => {
              const otherNodeId =
                rel.source === `n:${node.uuid}` || rel.source === node.uuid
                  ? rel.target
                  : rel.source;
              const cleanId = otherNodeId.replace(/^n:/, "");
              const title = getRelatedNodeTitle?.(cleanId) ?? cleanId;
              const relationLabel = formatLabel(
                rel.label || rel.relation_type || "Related"
              );
              return (
                <button
                  key={`${rel.id}-${idx}`}
                  onClick={() => onNodeSelect(cleanId)}
                  className="flex items-center gap-2 text-sm w-full p-2 rounded hover:bg-base-200 transition-colors text-left"
                >
                  <span className="text-base-content/70 shrink-0 text-xs">
                    {relationLabel}
                  </span>
                  <span className="font-bold text-base-content truncate min-w-0 capitalize">
                    {title}
                  </span>
                </button>
              );
            })}
            {nodeRelationships.length > 12 && (
              <div className="text-xs text-base-content/50 p-2">
                + {nodeRelationships.length - 12} more
              </div>
            )}
          </div>
        </section>
      )}

      {/* Attributes */}
      {node.attributes && Object.keys(node.attributes).length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-base-content/70 mb-2">
            Attributes
          </h3>
          <Attributes attributes={node.attributes} />
        </section>
      )}
    </div>
  );
}
