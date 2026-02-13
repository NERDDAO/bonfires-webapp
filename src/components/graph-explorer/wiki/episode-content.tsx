"use client";

import React from "react";

import Attributes from "./attributes";
import type { WikiEpisodeContent } from "./wiki-panel-utils";
import {
  formatAttributeValue,
  formatDate,
  formatLabel,
} from "./wiki-panel-utils";

export interface EpisodeContentProps {
  episode: WikiEpisodeContent;
}

/**
 * Displays wiki content for an episode node.
 */
export function EpisodeContent({ episode }: EpisodeContentProps) {
  return (
    <div className="space-y-4">
      {/* Description */}
      {episode.name && (
        <section>
          <h3 className="font-medium mb-2">
            Title
          </h3>
          <p className="text-sm leading-relaxed">
            {episode.name}
          </p>
        </section>
      )}

      {/* Summary */}
      {episode.name && (
        <section>
          <h3 className="font-medium mb-2">
            Summary
          </h3>
          <p className="text-sm leading-relaxed">
            {episode.content}
          </p>
        </section>
      )}

      {/* Timeline */}
      {episode.valid_at && (
        <section>
          <h3 className="font-medium mb-2">
            Timeline
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="badge badge-outline badge-sm">
              {formatDate(episode.valid_at)}
            </span>
          </div>
        </section>
      )}

      {/* Attributes */}
      {episode.updates && Object.keys(episode.updates).length > 0 && (
        <section>
          <h3 className="font-medium mb-2">
            Updates
          </h3>
          <div className="bg-[#2D2E33] rounded-lg divide-y divide-[#37393F]">
            {episode.updates.map((update) => (
              <div
                key={update.description}
                className="px-3 py-2.5 text-sm first:pt-2.5 last:pb-2.5"
              >
                <div className="text-base-content/90 wrap-break-word leading-relaxed">
                  {update.description || "—"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
