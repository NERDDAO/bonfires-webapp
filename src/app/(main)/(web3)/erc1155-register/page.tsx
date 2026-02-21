import type { Metadata } from "next";

import { ProvisionWizard } from "@/components/web3/ProvisionWizard";

export const metadata: Metadata = {
  title: "Provision Bonfire",
  description:
    "Burn your ERC-1155 access token to provision a Bonfire on Ethereum Mainnet and set up your Delve knowledge stack.",
};

export default function Erc1155RegisterPage() {
  return <ProvisionWizard />;
}
