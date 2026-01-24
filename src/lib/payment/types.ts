/**
 * X402 Payment Protocol Types
 */

export interface X402PaymentHeader {
  payload: string;
  signature: string;
  network: string;
}

export interface PaymentConfig {
  tokenAddress: string;
  intermediaryAddress: string;
  network: string;
  chainId: number;
  amount: string;
}

export interface TypedDataDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface X402PaymentMessage {
  tokenAddress: string;
  recipientAddress: string;
  amount: string;
  nonce: string;
  deadline: string;
}

export interface PaymentTypedData {
  domain: TypedDataDomain;
  types: {
    [key: string]: Array<{ name: string; type: string }>;
  };
  primaryType: string;
  message: X402PaymentMessage;
}
