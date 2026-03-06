/**
 * ERC-8004 Metadata Builder Tests
 */
import { buildErc8004Metadata } from "@/lib/erc8004/metadata";
import type { ProvisionFormData } from "@/types";

describe("buildErc8004Metadata", () => {
  const baseForm: ProvisionFormData = {
    agentName: "My Research Bonfire",
    description: "A knowledge bonfire for DeFi research.",
    capabilities: ["DeFi research", "on-chain data"],
  };

  beforeEach(() => {
    process.env["NEXT_PUBLIC_DELVE_API_URL"] = "https://api.delve.example.com";
  });

  afterEach(() => {
    delete process.env["NEXT_PUBLIC_DELVE_API_URL"];
  });

  it("should produce valid metadata with all required fields", () => {
    const result = buildErc8004Metadata(baseForm);

    expect(result).toEqual({
      name: "My Research Bonfire",
      description: "A knowledge bonfire for DeFi research.",
      services: [{ endpoint: "https://api.delve.example.com", x402Support: true }],
      capabilities: ["DeFi research", "on-chain data"],
    });
  });

  it("should set services[0].x402Support to true", () => {
    const result = buildErc8004Metadata(baseForm);

    expect(result.services).toHaveLength(1);
    expect(result.services[0].x402Support).toBe(true);
  });

  it("should use NEXT_PUBLIC_DELVE_API_URL as the service endpoint", () => {
    process.env["NEXT_PUBLIC_DELVE_API_URL"] = "https://custom.api.url";
    const result = buildErc8004Metadata(baseForm);

    expect(result.services[0].endpoint).toBe("https://custom.api.url");
  });

  it("should fall back to localhost when env var is unset", () => {
    delete process.env["NEXT_PUBLIC_DELVE_API_URL"];
    const result = buildErc8004Metadata(baseForm);

    expect(result.services[0].endpoint).toBe("http://localhost:8000");
  });

  it("should pass capabilities through unchanged", () => {
    const form: ProvisionFormData = {
      ...baseForm,
      capabilities: ["cap-a", "cap-b", "cap-c"],
    };
    const result = buildErc8004Metadata(form);

    expect(result.capabilities).toEqual(["cap-a", "cap-b", "cap-c"]);
  });

  it("should handle empty capabilities array", () => {
    const form: ProvisionFormData = {
      ...baseForm,
      capabilities: [],
    };
    const result = buildErc8004Metadata(form);

    expect(result.capabilities).toEqual([]);
  });

  it("should map agentName to name field", () => {
    const form: ProvisionFormData = {
      ...baseForm,
      agentName: "Special Agent Name",
    };
    const result = buildErc8004Metadata(form);

    expect(result.name).toBe("Special Agent Name");
  });
});
