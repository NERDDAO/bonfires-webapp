"use strict";

import type { GraphData } from "@/types/graph";
import type { DataRoomInfo, DataRoomListResponse } from "@/types/api";
import type { PaymentTransaction } from "@/types/web3";

export const mockBonfires = [
  { id: "bonfire-1", name: "Atlas Bonfire" },
  { id: "bonfire-2", name: "Nova Bonfire" },
];

export const mockAgents = [
  { id: "agent-1", name: "Agent Atlas", episode_uuids: ["node-1"] },
  { id: "agent-2", name: "Agent Nova", episode_uuids: ["node-1"] },
];

export const mockGraphData: GraphData = {
  nodes: [
    {
      uuid: "node-1",
      name: "Atlas Launch",
      type: "episode",
      labels: ["Launch"],
      properties: {
        summary: "Atlas launch event",
        valid_at: "2025-12-01T00:00:00Z",
      },
    },
    {
      uuid: "node-2",
      name: "Orion Module",
      type: "entity",
      labels: ["Module"],
      properties: {
        summary: "Key module for mission operations",
      },
    },
  ],
  edges: [
    {
      source: "node-1",
      target: "node-2",
      type: "relates_to",
      properties: {
        strength: 0.82,
      },
    },
  ],
  metadata: {
    bonfire_id: "bonfire-1",
    agent_id: "agent-1",
    query: "atlas",
    timestamp: new Date().toISOString(),
  },
};

export const mockDataRooms: DataRoomInfo[] = [
  {
    id: "dataroom-1",
    creator_wallet: "0xE2E0000000000000000000000000000000000000",
    bonfire_id: "bonfire-1",
    description: "Atlas mission data room",
    system_prompt: "Focus on mission events",
    center_node_uuid: "node-1",
    price_usd: 1.25,
    query_limit: 25,
    expiration_days: 30,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    bonfire_name: "Atlas Bonfire",
    dynamic_pricing_enabled: false,
  },
];

export const mockDataRoomsResponse: DataRoomListResponse = {
  datarooms: mockDataRooms,
  count: mockDataRooms.length,
  limit: 20,
  offset: 0,
};

export const mockPaymentHistory: PaymentTransaction[] = [
  {
    id: "payment-1",
    user_wallet: "0xE2E0000000000000000000000000000000000000",
    amount_usd: 0.01,
    tx_hash: "0xabc123",
    status: "confirmed",
    type: "chat",
    resource_id: "agent-1",
    created_at: new Date().toISOString(),
  },
];

export const mockMicrosubs = [
  {
    tx_hash: "0xmicrosub1",
    agent_id: "agent-1",
    agent_name: "Agent Atlas",
    bonfire_id: "bonfire-1",
    bonfire_name: "Atlas Bonfire",
    description: "Atlas mission data room",
    system_prompt: "Focus on mission events",
    center_node_uuid: "node-1",
    queries_remaining: 5,
    total_queries: 10,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_expired: false,
    is_exhausted: false,
    is_valid: true,
    created_at: new Date().toISOString(),
    dataroom_id: "dataroom-1",
  },
];

export const mockPreviewEntities = [
  {
    uuid: "node-1",
    name: "Atlas Launch",
    summary: "Atlas launch event",
    entity_type: "episode",
  },
  {
    uuid: "node-2",
    name: "Orion Module",
    summary: "Module details",
    entity_type: "entity",
  },
];
