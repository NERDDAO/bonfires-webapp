/**
 * WikiPanel Tests
 *
 * Ensures the wiki panel renders node actions correctly.
 */
import type { WikiBreadcrumb, WikiMode } from "@/hooks";
import { fireEvent, render, screen } from "@testing-library/react";

import { type WikiNodeData, WikiPanel } from "@/components/graph/WikiPanel";

const baseNode: WikiNodeData = {
  uuid: "node-123",
  name: "Test Node",
  type: "entity",
};

const breadcrumbs: WikiBreadcrumb[] = [];
const mode: WikiMode = "sidebar";

describe("WikiPanel", () => {
  it("calls onSearchAroundNode when clicking the search action", () => {
    const onSearchAroundNode = jest.fn();

    render(
      <WikiPanel
        node={baseNode}
        edge={null}
        edgeSourceNode={null}
        edgeTargetNode={null}
        nodeRelationships={[]}
        enabled
        mode={mode}
        breadcrumbs={breadcrumbs}
        canGoBack={false}
        canGoForward={false}
        onClose={jest.fn()}
        onToggleMode={jest.fn()}
        onBack={jest.fn()}
        onForward={jest.fn()}
        onNodeSelect={jest.fn()}
        onSearchAroundNode={onSearchAroundNode}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Search around this node" })
    );
    expect(onSearchAroundNode).toHaveBeenCalledWith("node-123");
  });

  it("does not render the search action when no node is selected", () => {
    render(
      <WikiPanel
        node={null}
        edge={null}
        edgeSourceNode={null}
        edgeTargetNode={null}
        nodeRelationships={[]}
        enabled
        mode={mode}
        breadcrumbs={breadcrumbs}
        canGoBack={false}
        canGoForward={false}
        onClose={jest.fn()}
        onToggleMode={jest.fn()}
        onBack={jest.fn()}
        onForward={jest.fn()}
        onNodeSelect={jest.fn()}
        onSearchAroundNode={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Search around this node" })
    ).toBeNull();
  });
});
