/**
 * React Query Hooks
 *
 * Re-exports all query hooks for convenient imports.
 */

// Bonfires
export {
  useBonfiresQuery,
  useBonfireById,
  bonfiresQueryKey,
} from "./useBonfiresQuery";

// Agents
export {
  useAgentsQuery,
  useAgentById,
  useActiveAgents,
  agentsQueryKey,
} from "./useAgentsQuery";

// Agent selection (React Query–based; use with AgentSelector)
export { useAgentSelectionQuery } from "./useAgentSelectionQuery";

// Graph
export {
  useGraphQuery,
  useGraphExpand,
  useGraphSearch,
  graphQueryKey,
} from "./useGraphQuery";

// Latest episodes graph (graph-2)
export {
  useLatestEpisodesGraph,
  latestEpisodesGraphQueryKey,
} from "./useLatestEpisodesGraph";

// Data Rooms
export {
  useDataRoomsQuery,
  useDataRoomsInfiniteQuery,
  useDataRoomById,
  useMyCreatedDataRooms,
  useMySubscribedDataRooms,
  dataRoomsQueryKey,
} from "./useDataRoomsQuery";

// HyperBlogs
export {
  useHyperBlogsQuery,
  useHyperBlogById,
  useMyHyperBlogs,
  usePublicHyperBlogsFeed,
  useDataRoomHyperBlogs,
  useDataRoomHyperBlogsInfiniteQuery,
  hyperBlogsQueryKey,
} from "./useHyperBlogsQuery";

// Documents
export {
  useDocumentsQuery,
  useDocumentById,
  useCompletedDocuments,
  useProcessingDocuments,
  useLabeledChunks,
  documentsQueryKey,
  labeledChunksQueryKey,
} from "./useDocumentsQuery";

// Taxonomy
export {
  useTaxonomyStatsQuery,
  taxonomyStatsQueryKey,
} from "./useTaxonomyStatsQuery";

// Job Polling
export {
  useJobStatusPolling,
  useStartJob,
  useJobWithPolling,
  jobStatusQueryKey,
} from "./useJobStatusPolling";

// Payment History
export {
  usePaymentHistoryQuery,
  useMyPaymentHistory,
  usePaymentHistoryByType,
  paymentHistoryQueryKey,
} from "./usePaymentHistoryQuery";

// Dashboard
export {
  useDashboardData,
  useDashboardRequiresWallet,
  useRefreshDashboard,
} from "./useDashboardData";

// HTN Templates
export {
  useHTNTemplatesQuery,
  htnTemplatesQueryKey,
} from "./useHTNTemplatesQuery";
