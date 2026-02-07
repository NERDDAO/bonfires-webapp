"use strict";

import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./utils/mockApi";
import { setWalletConnected } from "./utils/wallet";

test.describe("Hyperblogs flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test("creates a hyperblog purchase request", async ({ page }) => {
    await page.goto("/hyperblogs");
    await setWalletConnected(page, true);

    const createButton = page.getByRole("button", { name: "Create Blog" }).first();
    await createButton.click();

    const modalHeading = page.getByRole("heading", { name: "Create Blog" });
    await expect(modalHeading).toBeVisible();

    await page.getByLabel("Description").fill("Summarize key Atlas updates.");
    await page.getByRole("button", { name: "Create Blog" }).last().click();

    await expect(modalHeading).toHaveCount(0);
  });
});
