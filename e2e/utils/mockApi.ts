"use strict";

import type { Page, Route } from "@playwright/test";
import {
  mockAgents,
  mockBonfires,
  mockDataRooms,
  mockDataRoomsResponse,
  mockGraphData,
  mockMicrosubs,
  mockPaymentHistory,
  mockPreviewEntities,
} from "../fixtures/mockData";

interface MockApiOptions {
  failPayments?: boolean;
  failMicrosubCreation?: boolean;
}

function jsonResponse(route: Route, status: number, data: unknown) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

export async function mockApiRoutes(page: Page, options: MockApiOptions = {}) {
  const jobCallCounts = new Map<string, number>();

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();

    if (pathname === "/api/bonfires" && method === "GET") {
      return jsonResponse(route, 200, { bonfires: mockBonfires });
    }

    const bonfireAgentsMatch = pathname.match(/^\/api\/bonfires\/([^/]+)\/agents$/);
    if (bonfireAgentsMatch && method === "GET") {
      return jsonResponse(route, 200, { agents: mockAgents, total: mockAgents.length });
    }

    const episodesSearchMatch = pathname.match(
      /^\/api\/agents\/([^/]+)\/episodes\/search$/
    );
    if (episodesSearchMatch && method === "POST") {
      const episodeNodes = mockGraphData.nodes.filter((node) => node.type === "episode");
      return jsonResponse(route, 200, {
        success: true,
        query: "",
        num_results: episodeNodes.length,
        nodes: mockGraphData.nodes,
        edges: mockGraphData.edges,
        entities: [],
        episodes: episodeNodes.map((node) => ({
          uuid: node.uuid,
          name: node.name,
          summary: node.properties?.["summary"],
          valid_at: node.properties?.["valid_at"],
        })),
      });
    }

    if (pathname === "/api/graph/query" && method === "POST") {
      return jsonResponse(route, 200, {
        success: true,
        query: "atlas",
        num_results: 10,
        entities: mockPreviewEntities,
        nodes: mockGraphData.nodes,
        edges: mockGraphData.edges,
        episodes: [],
        cached: false,
      });
    }

    if (pathname === "/api/graph/search" && method === "POST") {
      return jsonResponse(route, 200, {
        success: true,
        results: [
          { content: "Atlas chunk summary", score: 0.82 },
        ],
        count: 1,
        query: "atlas",
      });
    }

    if (pathname === "/api/graph/expand" && method === "POST") {
      return jsonResponse(route, 200, {
        success: true,
        query: "",
        num_results: 10,
        entities: mockPreviewEntities,
        nodes: mockGraphData.nodes,
        edges: mockGraphData.edges,
        episodes: [],
        cached: false,
      });
    }

    const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/);
    if (jobMatch && method === "GET") {
      const jobId = jobMatch[1];
      if (!jobId) {
        return jsonResponse(route, 400, { error: "Missing job ID" });
      }
      const count = (jobCallCounts.get(jobId) ?? 0) + 1;
      jobCallCounts.set(jobId, count);
      if (count < 2) {
        return jsonResponse(route, 200, {
          status: "running",
          progress: 40,
        });
      }
      return jsonResponse(route, 200, {
        status: "complete",
        progress: 100,
        result: mockGraphData,
      });
    }

    if (pathname === "/api/datarooms" && method === "GET") {
      return jsonResponse(route, 200, mockDataRoomsResponse);
    }

    if (pathname === "/api/datarooms" && method === "POST") {
      return jsonResponse(route, 200, mockDataRooms[0]);
    }

    const dataroomMatch = pathname.match(/^\/api\/datarooms\/([^/]+)$/);
    if (dataroomMatch && method === "GET") {
      const dataroom = mockDataRooms.find((room) => room.id === dataroomMatch[1]);
      return jsonResponse(route, 200, dataroom ?? mockDataRooms[0]);
    }

    if (pathname === "/api/documents/ingest" && method === "POST") {
      return jsonResponse(route, 200, {
        success: true,
        document_id: "doc-1",
        message: "Document ingested successfully",
      });
    }

    if (pathname === "/api/documents" && method === "GET") {
      return jsonResponse(route, 200, {
        documents: [
          {
            id: "doc-1",
            name: "Atlas Specs",
            type: "md",
            size: 1280,
            bonfire_id: "bonfire-1",
            uploaded_at: new Date().toISOString(),
            processed: true,
            status: "completed",
          },
        ],
        chunks: [
          {
            uuid: "chunk-1",
            document_id: "doc-1",
            content: "Atlas chunk summary",
            labels: ["Launch"],
            index: 0,
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        limit: Number(searchParams.get("limit") ?? 20),
        offset: Number(searchParams.get("offset") ?? 0),
      });
    }

    if (pathname === "/api/hyperblogs" && method === "GET") {
      return jsonResponse(route, 200, {
        hyperblogs: [
          {
            id: "hyperblog-1",
            title: "Atlas Daily Brief",
            content: "Highlights from Atlas.",
            author_wallet: "0xE2E0000000000000000000000000000000000000",
            dataroom_id: "dataroom-1",
            price_usd: 2.5,
            view_count: 12,
            is_free: true,
            created_at: new Date().toISOString(),
            generation_status: "complete",
          },
        ],
        count: 1,
        limit: 20,
        offset: 0,
      });
    }

    if (pathname === "/api/hyperblogs/purchase" && method === "POST") {
      return jsonResponse(route, 201, {
        hyperblog: {
          id: "hyperblog-2",
          dataroom_id: "dataroom-1",
          user_query: "Mocked hyperblog purchase",
          generation_status: "generating",
          author_wallet: "0xE2E0000000000000000000000000000000000000",
          created_at: new Date().toISOString(),
          is_public: true,
          tx_hash: "0xhyperblog123",
          word_count: 0,
          blog_length: "medium",
          htn_graph_hash: "",
          preview: "",
        },
        payment: {
          verified: true,
          settled: true,
          tx_hash: "0xhyperblog123",
          from_address: "0xE2E0000000000000000000000000000000000000",
          facilitator: "mock",
          amount: "1.25",
        },
      });
    }

    if (pathname === "/api/payments/history" && method === "GET") {
      return jsonResponse(route, 200, { transactions: mockPaymentHistory });
    }

    if (pathname === "/api/microsubs" && method === "GET") {
      return jsonResponse(route, 200, { microsubs: mockMicrosubs, count: mockMicrosubs.length });
    }

    if (pathname === "/api/microsubs" && method === "POST") {
      if (options.failMicrosubCreation) {
        return jsonResponse(route, 400, { error: "Payment failed" });
      }
      return jsonResponse(route, 200, {
        microsub: { tx_hash: "0xmicrosub1" },
      });
    }

    const agentChatMatch = pathname.match(/^\/api\/agents\/([^/]+)\/chat$/);
    if (agentChatMatch && method === "POST") {
      if (options.failPayments) {
        return jsonResponse(route, 402, { error: "Payment required" });
      }
      return jsonResponse(route, 200, {
        reply: "Atlas analysis complete.",
        payment: {
          verified: true,
          settled: true,
          tx_hash: "0xchat123",
          queries_remaining: 4,
        },
      });
    }

    const delveMatch = pathname.match(/^\/api\/agents\/([^/]+)\/delve$/);
    if (delveMatch && method === "POST") {
      if (options.failPayments) {
        return jsonResponse(route, 402, { error: "Payment required" });
      }
      return jsonResponse(route, 200, {
        success: true,
        query: "atlas",
        entities: [
          { name: "Atlas Launch", summary: "Launch event", uuid: "node-1" },
        ],
        episodes: [
          { summary: "Episode summary" },
        ],
        metrics: {
          entity_count: 1,
          episode_count: 1,
          edge_count: 1,
        },
        payment: {
          verified: true,
          settled: true,
          tx_hash: "0xdelve123",
          queries_remaining: 3,
        },
      });
    }

    return jsonResponse(route, 404, { error: `Unhandled route: ${pathname}` });
  });
}
