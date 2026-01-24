"use strict";

import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./utils/mockApi";
import { setWalletConnected } from "./utils/wallet";

test.describe("Cross-feature navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto("/");
    await setWalletConnected(page, true);
  });

  test("navigates across key sections", async ({ page }) => {
    await page.goto("/graph");
    await expect(page).toHaveURL(/\/graph/);

    await page.goto("/datarooms");
    await expect(page).toHaveURL(/\/datarooms/);

    await page.goto("/documents");
    await expect(page).toHaveURL(/\/documents/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
