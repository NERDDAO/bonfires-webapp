"use client";

import type { McpTool } from "@/types/agent-config";

interface McpToolsSectionProps {
  tools: McpTool[];
  enabledTools: string[];
  onChange: (enabledTools: string[]) => void;
  isLoading?: boolean;
}

export function McpToolsSection({
  tools,
  enabledTools,
  onChange,
  isLoading,
}: McpToolsSectionProps) {
  if (isLoading) {
    return <span className="loading loading-spinner loading-md" />;
  }

  const toolsByGroup: Record<string, McpTool[]> = {};
  for (const tool of tools) {
    const group = tool.group || "Other";
    if (!toolsByGroup[group]) toolsByGroup[group] = [];
    toolsByGroup[group].push(tool);
  }

  return (
    <div>
      {Object.entries(toolsByGroup).map(([group, groupTools]) => (
        <div key={group} className="mb-4">
          <h4 className="text-sm font-medium text-base-content/60 mb-2">{group}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {groupTools.map((tool) => (
              <label
                key={tool.id}
                className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-base-300"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary mt-0.5"
                  checked={enabledTools.includes(tool.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...enabledTools, tool.id]
                      : enabledTools.filter((id) => id !== tool.id);
                    onChange(next);
                  }}
                />
                <div>
                  <span className="text-sm font-medium">{tool.name}</span>
                  {tool.description && (
                    <p className="text-xs text-base-content/50">{tool.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      {tools.length === 0 && (
        <p className="text-sm text-base-content/40">No MCP tools available</p>
      )}
    </div>
  );
}
