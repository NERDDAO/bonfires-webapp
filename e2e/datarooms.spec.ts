"use strict";

import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./utils/mockApi";
import { setWalletConnected } from "./utils/wallet";

test.describe("Data rooms flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test("creates a data room and subscribes", async ({ page }) => {
    await page.goto("/datarooms");
    await setWalletConnected(page, true);
    await expect(page.getByRole("heading", { name: "Data Room Marketplace" })).toBeVisible();

    await page.getByRole("button", { name: "+Create Data Room" }).click();
    await expect(page.getByRole("heading", { name: "Create Data Room" })).toBeVisible();

    const wizardSelect = page.locator(".modal-box select").first();
    await page.waitForFunction(() => {
      const select = document.querySelector<HTMLSelectElement>(".modal-box select");
      return !!select && select.options.length > 1;
    });
    await wizardSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: "Next" }).click();

    await page
      .getByPlaceholder("Describe the data room purpose and scope...")
      .fill("Atlas mission brief for subscribers");
    await page.getByRole("button", { name: "Next" }).click();

    const firstEntityCard = page.locator(".modal-box .card").first();
    await expect(firstEntityCard).toBeVisible();
    await firstEntityCard.click();
    await page
      .locator(".modal-box")
      .getByRole("button", { name: "Create Data Room" })
      .click();

    await expect(page.getByText("Atlas mission data room")).toBeVisible();

    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page).toHaveURL(/\/x402-chat\?dataroom=dataroom-1/);
  });
});
