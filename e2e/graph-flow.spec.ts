"use strict";

import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./utils/mockApi";
import { setWalletConnected } from "./utils/wallet";

test.describe("Graph exploration flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test("loads graph data with async polling and search", async ({ page }) => {
    await page.goto("/graph");
    await setWalletConnected(page, true);

    const bonfireSelect = page.getByRole("combobox").nth(0);
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>("select");
      const first = selects.item(0);
      const second = selects.item(1);
      if (!first || !second) return false;
      return first.options.length > 1;
    });
    await bonfireSelect.selectOption({ index: 1 });

    const agentSelect = page.getByRole("combobox").nth(1);
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>("select");
      const second = selects.item(1);
      if (!second) return false;
      return !second.disabled && second.options.length > 1;
    });
    await agentSelect.selectOption({ index: 1 });

    await expect(page.getByRole("application")).toHaveAttribute(
      "aria-label",
      /Interactive knowledge graph/
    );

    await page.getByPlaceholder("Search graph...").fill("Atlas");
    await page.getByPlaceholder("Search graph...").press("Enter");
    await expect(page).toHaveURL(/q=Atlas/);

    await expect(page.getByText("Graph summary:")).toBeVisible();
  });
});
