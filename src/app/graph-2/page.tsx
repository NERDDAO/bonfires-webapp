"use client";

import {
  GraphSelect,
  StaticGraphView,
  useGraphContext,
} from "@/components/graph-explorer";
import { LoadingSpinner, ErrorMessage } from "@/components/common";
import { useLatestEpisodesGraph } from "@/hooks/queries";

export default function GraphPage() {
  const { selectedBonfireId, selectedAgentId } = useGraphContext();
  const showGraph = Boolean(selectedBonfireId && selectedAgentId);

  const graphQuery = useLatestEpisodesGraph({
    bonfireId: selectedBonfireId,
    agentId: selectedAgentId,
    limit: 10,
    enabled: showGraph,
  });

  const { data: graphData, isLoading, error } = graphQuery;

  return (
    <div className="min-h-[calc(100vh-5rem)] relative">
      <GraphSelect />
      {showGraph && (
        <>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/80">
              <LoadingSpinner size="lg" text="Loading graph..." />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <ErrorMessage
                message={error instanceof Error ? error.message : "Failed to load graph"}
                variant="card"
              />
            </div>
          )}
          {!isLoading && !error && graphData && graphData.nodes.length > 0 && (
            <StaticGraphView graphData={graphData} />
          )}
          {!isLoading && !error && graphData && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-base-content/60">
              <p className="text-lg font-medium">No graph data</p>
              <p className="text-sm mt-1">
                This agent has no episodes or entities to display yet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
