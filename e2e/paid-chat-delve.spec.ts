"use strict";

import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./utils/mockApi";
import { setWalletConnected } from "./utils/wallet";

test.describe("Paid chat and delve flows", () => {
  test("paid chat completes successfully", async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto("/x402-chat");
    await setWalletConnected(page, true);

    const selectors = page.getByRole("combobox");
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>("select");
      const first = selects.item(0);
      const second = selects.item(1);
      if (!first || !second) return false;
      return first.options.length > 1;
    });
    await selectors.nth(0).selectOption({ index: 1 });
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>("select");
      const second = selects.item(1);
      if (!second) return false;
      return !second.disabled && second.options.length > 1;
    });
    await selectors.nth(1).selectOption({ index: 1 });

    await page.getByPlaceholder("Type your message...").fill("Summarize Atlas.");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("Atlas analysis complete.")).toBeVisible();
    await expect(page.getByText(/queries left/i)).toBeVisible();
  });

  test("paid chat surfaces payment errors", async ({ page }) => {
    await mockApiRoutes(page, { failPayments: true });
    await page.goto("/x402-chat");
    await setWalletConnected(page, true);

    const selectors = page.getByRole("combobox");
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>("select");
      const first = selects.item(0);
      const second = selects.item(1);
      if (!first || !second) return false;
      return first.options.length > 1;
    });
    await selectors.nth(0).selectOption({ index: 1 });
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>("select");
      const second = selects.item(1);
      if (!second) return false;
      return !second.disabled && second.options.length > 1;
    });
    await selectors.nth(1).selectOption({ index: 1 });

    await page.getByPlaceholder("Type your message...").fill("Test payment.");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText(/Payment required/i)).toBeVisible();
  });

  test("paid delve returns results", async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto("/x402-delve");
    await setWalletConnected(page, true);

    const bonfireSelect = page.getByRole("combobox").first();
    await page.waitForFunction(() => {
      const select = document.querySelector<HTMLSelectElement>("select");
      return !!select && select.options.length > 1;
    });
    await bonfireSelect.selectOption({ index: 1 });

    await page.getByPlaceholder("Enter your search query...").fill("Atlas");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("Entities (1)")).toBeVisible();
    await expect(page.getByText("Atlas Launch")).toBeVisible();
  });

  test("paid delve surfaces payment errors", async ({ page }) => {
    await mockApiRoutes(page, { failPayments: true });
    await page.goto("/x402-delve");
    await setWalletConnected(page, true);

    const bonfireSelect = page.getByRole("combobox").first();
    await page.waitForFunction(() => {
      const select = document.querySelector<HTMLSelectElement>("select");
      return !!select && select.options.length > 1;
    });
    await bonfireSelect.selectOption({ index: 1 });

    await page.getByPlaceholder("Enter your search query...").fill("Atlas");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText(/Payment required/i)).toBeVisible();
  });
});
