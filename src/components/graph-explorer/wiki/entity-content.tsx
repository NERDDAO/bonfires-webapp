"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import type { WikiEdgeData, WikiNodeData } from "./wiki-panel-utils";
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
      {/* Name */}
      <section>
        <h3 className="font-medium mb-2">
          Title
        </h3>
        <p className="text-sm leading-relaxed">
          {node.name}
        </p>
      </section>

      {/* Description */}
      {(node.summary || node.content) && (
        <section>
          <h3 className="font-medium mb-2">
            Description
          </h3>
          <p className="text-sm leading-relaxed">
            {node.summary || node.content}
          </p>
        </section>
      )}

      {/* Relationships as badges */}
      {nodeRelationships.length > 0 && (
        <section>
          <h3 className="font-medium mb-2">
            Relationships ({nodeRelationships.length})
          </h3>
          <p className="leading-8">
            {nodeRelationships.map((rel, idx) => {
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
                <Badge
                  key={`${rel.id}-${idx}`}
                  onClick={() => onNodeSelect(cleanId)}
                  variant="outline" 
                  className="mr-2 capitalize whitespace-normal text-left hover:bg-[#37393F] focus:outline-none cursor-pointer rounded-xl">
                  {relationLabel}: {title}
                </Badge>
              );
            })}
          </p>
        </section>
      )}

      {/* Attributes in list UI (same as previous Relationships block) */}
      {node.attributes && Object.keys(node.attributes).length > 0 && (
        <section>
          <h3 className="font-medium mb-2">
            Attributes
          </h3>
          <Attributes attributes={node.attributes} />
        </section>
      )}
    </div>
  );
}
