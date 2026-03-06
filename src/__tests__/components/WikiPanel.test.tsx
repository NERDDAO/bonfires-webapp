/**
 * WikiPanel Tests
 *
 * Ensures the wiki panel renders node actions correctly.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { WikiPanel } from "@/app/(main)/(graph)/graph/_components/wiki/wiki-panel";
import type { WikiNodeData } from "@/app/(main)/(graph)/graph/_components/wiki/wiki-panel-utils";

const baseNode: WikiNodeData = {
  uuid: "node-123",
  name: "Test Node",
  type: "entity",
};

describe("WikiPanel", () => {
  it("calls onSearchAroundNode when clicking the search action", () => {
    const onSearchAroundNode = jest.fn();

    render(
      <WikiPanel
        node={baseNode}
        edge={null}
        nodeRelationships={[]}
        enabled
        onClose={jest.fn()}
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
        nodeRelationships={[]}
        enabled
        onClose={jest.fn()}
        onNodeSelect={jest.fn()}
        onSearchAroundNode={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Search around this node" })
    ).toBeNull();
  });
});
