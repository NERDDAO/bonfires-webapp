"use strict";

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockApiRoutes } from "./utils/mockApi";
import { setWalletConnected } from "./utils/wallet";

const pagesToAudit = ["/", "/graph", "/datarooms", "/dashboard"];

test.describe("Accessibility audits", () => {
  for (const path of pagesToAudit) {
    test(`page ${path} has no WCAG violations`, async ({ page }) => {
      await mockApiRoutes(page);
      await page.goto(path);
      await setWalletConnected(page, true);

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
