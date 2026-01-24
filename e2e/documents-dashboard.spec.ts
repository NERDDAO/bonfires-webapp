"use strict";

import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./utils/mockApi";
import { setWalletConnected } from "./utils/wallet";

test.describe("Documents and dashboard flows", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test("uploads a document and shows dashboard data", async ({ page }) => {
    await page.goto("/documents");
    await setWalletConnected(page, true);

    const bonfireSelect = page.locator("select").first();
    await page.waitForFunction(() => {
      const select = document.querySelector<HTMLSelectElement>("select");
      return !!select && !select.disabled && select.options.length > 1;
    });
    await bonfireSelect.selectOption({ index: 1 });

    await expect(
      page.getByRole("heading", { name: "Upload Document" })
    ).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.waitFor({ state: "attached" });
    await fileInput.setInputFiles({
      name: "atlas.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("# Atlas\nLaunch details"),
    });

    await page.getByRole("button", { name: "Upload Document" }).click();
    await expect(page.getByText("Upload complete!")).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText("Payment History")).toBeVisible();
    await expect(page.getByText("My Data Rooms")).toBeVisible();
  });
});
