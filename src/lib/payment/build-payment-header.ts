/**
 * X402 Payment Header Builder
 *
 * Utilities for building and signing X402 payment headers.
 */

import type {
  PaymentTypedData,
  X402PaymentHeader,
  X402PaymentMessage,
} from "./types";

interface BuildPaymentParams {
  tokenAddress: string;
  recipientAddress: string;
  amount: string;
  network: string;
  chainId: number;
  userAddress: string;
}

/**
 * Build EIP-712 typed data for X402 payment
 */
export function buildPaymentTypedData(
  params: BuildPaymentParams
): PaymentTypedData {
  const { tokenAddress, recipientAddress, amount, chainId } = params;

  // Generate nonce and deadline
  const nonce = Date.now().toString();
  const deadline = Math.floor(Date.now() / 1000 + 3600).toString(); // 1 hour from now

  const domain = {
    name: "X402Payment",
    version: "1",
    chainId,
    verifyingContract: tokenAddress,
  };

  const types = {
    Payment: [
      { name: "tokenAddress", type: "address" },
      { name: "recipientAddress", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message: X402PaymentMessage = {
    tokenAddress,
    recipientAddress,
    amount,
    nonce,
    deadline,
  };

  return {
    domain,
    types,
    primaryType: "Payment",
    message,
  };
}

/**
 * Encode payment header for X402 protocol
 */
export function encodePaymentHeader(
  message: X402PaymentMessage,
  signature: string,
  network: string
): X402PaymentHeader {
  const payload = Buffer.from(JSON.stringify(message)).toString("base64");

  return {
    payload,
    signature,
    network,
  };
}
