"use strict";

import type { Page } from "@playwright/test";

export async function setWalletConnected(
  page: Page,
  connected: boolean,
  address = "0xE2E0000000000000000000000000000000000000"
) {
  await page.evaluate(
    ({ connectedValue, addressValue }) => {
      window.localStorage.setItem("e2e.wallet.connected", String(connectedValue));
      if (connectedValue) {
        window.localStorage.setItem("e2e.wallet.address", addressValue);
      } else {
        window.localStorage.removeItem("e2e.wallet.address");
      }
      window.dispatchEvent(new CustomEvent("e2e-wallet-update"));
    },
    { connectedValue: connected, addressValue: address }
  );
}

export async function setWalletBalance(page: Page, balance = "1.2345") {
  await page.evaluate((balanceValue) => {
    window.localStorage.setItem("e2e.wallet.balance", balanceValue);
    window.dispatchEvent(new CustomEvent("e2e-wallet-update"));
  }, balance);
}
