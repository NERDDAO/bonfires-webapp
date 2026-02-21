/**
 * IPFS Upload Route Tests
 *
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { POST } from "@/app/api/ipfs/upload/route";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/ipfs/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function parseResponse(response: Response) {
  return response.json();
}

describe("POST /api/ipfs/upload", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env["PINATA_JWT"] = "test-jwt-token";
    process.env["NEXT_PUBLIC_DELVE_API_URL"] = "https://api.delve.test";
  });

  afterEach(() => {
    delete process.env["PINATA_JWT"];
    delete process.env["NEXT_PUBLIC_DELVE_API_URL"];
  });

  it("should return ipfs_uri on successful upload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          IpfsHash: "QmTestHash123",
          PinSize: 256,
          Timestamp: "2026-02-21T00:00:00Z",
        }),
    });

    const response = await POST(
      makeRequest({
        name: "Test Bonfire",
        description: "A test bonfire for unit tests.",
        capabilities: ["testing"],
      })
    );

    expect(response.status).toBe(200);

    const data = await parseResponse(response);
    expect(data.ipfs_uri).toBe("ipfs://QmTestHash123");
  });

  it("should send correct payload to Pinata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          IpfsHash: "QmTestHash123",
          PinSize: 256,
          Timestamp: "2026-02-21T00:00:00Z",
        }),
    });

    await POST(
      makeRequest({
        name: "Test Bonfire",
        description: "A test description.",
        capabilities: ["cap1"],
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt-token",
          "Content-Type": "application/json",
        }),
      })
    );

    const callBody = JSON.parse(
      mockFetch.mock.calls[0][1].body
    );
    expect(callBody.pinataContent).toEqual({
      name: "Test Bonfire",
      description: "A test description.",
      services: [{ endpoint: "https://api.delve.test", x402Support: true }],
      capabilities: ["cap1"],
    });
  });

  it("should return 400 when name is missing", async () => {
    const response = await POST(
      makeRequest({
        description: "A test description.",
      })
    );

    expect(response.status).toBe(400);

    const data = await parseResponse(response);
    expect(data.error).toBe("name is required");
  });

  it("should return 400 when description is missing", async () => {
    const response = await POST(
      makeRequest({
        name: "Test Bonfire",
      })
    );

    expect(response.status).toBe(400);

    const data = await parseResponse(response);
    expect(data.error).toBe("description is required");
  });

  it("should return 400 when name is empty string", async () => {
    const response = await POST(
      makeRequest({
        name: "   ",
        description: "A test description.",
      })
    );

    expect(response.status).toBe(400);

    const data = await parseResponse(response);
    expect(data.error).toBe("name is required");
  });

  it("should return 500 when PINATA_JWT is not configured", async () => {
    delete process.env["PINATA_JWT"];

    const response = await POST(
      makeRequest({
        name: "Test Bonfire",
        description: "A test description.",
      })
    );

    expect(response.status).toBe(500);

    const data = await parseResponse(response);
    expect(data.error).toContain("not configured");
  });

  it("should return 500 when Pinata returns an error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    const response = await POST(
      makeRequest({
        name: "Test Bonfire",
        description: "A test description.",
      })
    );

    expect(response.status).toBe(500);

    const data = await parseResponse(response);
    expect(data.error).toContain("Failed to upload");
  });

  it("should return 500 when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error("Network error")
    );

    const response = await POST(
      makeRequest({
        name: "Test Bonfire",
        description: "A test description.",
      })
    );

    expect(response.status).toBe(500);

    const data = await parseResponse(response);
    expect(data.error).toContain("Failed to upload");
  });

  it("should default capabilities to empty array when not provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          IpfsHash: "QmHash",
          PinSize: 128,
          Timestamp: "2026-02-21T00:00:00Z",
        }),
    });

    await POST(
      makeRequest({
        name: "Test Bonfire",
        description: "A test description.",
      })
    );

    const callBody = JSON.parse(
      mockFetch.mock.calls[0][1].body
    );
    expect(callBody.pinataContent.capabilities).toEqual([]);
  });

  it("should trim name and description", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          IpfsHash: "QmHash",
          PinSize: 128,
          Timestamp: "2026-02-21T00:00:00Z",
        }),
    });

    await POST(
      makeRequest({
        name: "  Test Bonfire  ",
        description: "  A test description.  ",
        capabilities: ["cap1"],
      })
    );

    const callBody = JSON.parse(
      mockFetch.mock.calls[0][1].body
    );
    expect(callBody.pinataContent.name).toBe("Test Bonfire");
    expect(callBody.pinataContent.description).toBe("A test description.");
  });
});
