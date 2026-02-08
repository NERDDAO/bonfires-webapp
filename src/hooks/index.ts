/**
 * Custom Hooks
 *
 * Re-exports all hooks for convenient imports.
 */

// Utility Hooks
export {
  useMediaQuery,
  useIsMobile,
  MOBILE_BREAKPOINT_PX,
  MOBILE_MEDIA_QUERY,
} from "./useMediaQuery";
export {
  useLocalStorage,
  STORAGE_KEYS,
  getStorageValue,
  setStorageValue,
} from "./useLocalStorage";
export {
  useWikiNavigation,
  type WikiNavState,
  type WikiBreadcrumb,
  type WikiContentType,
} from "./useWikiNavigation";
export {
  useGraphExplorerState,
  getNodeFromElements,
  getEdgeFromElements,
  type PanelMode,
  type WikiMode,
  type SelectionState,
  type PanelState,
  type TimelineState,
  SelectionActionType,
  PanelActionType,
  TimelineActionType,
} from "./useGraphExplorer";
export {
  useFeatureAgentSelection,
  default as useFeatureAgentSelectionDefault,
  type FeatureStorageKey,
} from "./useFeatureAgentSelection";

// Query Hooks
export {
  // Bonfires
  useBonfiresQuery,
  useBonfireById,
  bonfiresQueryKey,
  // Agents
  useAgentsQuery,
  useAgentById,
  useActiveAgents,
  agentsQueryKey,
  // Agent selection (React Query)
  useAgentSelectionQuery,
  // Graph
  useGraphQuery,
  useGraphExpand,
  useGraphSearch,
  graphQueryKey,
  // Data Rooms
  useDataRoomsQuery,
  useDataRoomsInfiniteQuery,
  useDataRoomById,
  useMyCreatedDataRooms,
  useMySubscribedDataRooms,
  dataRoomsQueryKey,
  // HyperBlogs
  useHyperBlogsQuery,
  useHyperBlogById,
  useMyHyperBlogs,
  usePublicHyperBlogsFeed,
  useDataRoomHyperBlogs,
  useDataRoomHyperBlogsInfiniteQuery,
  hyperBlogsQueryKey,
  // Documents
  useDocumentsQuery,
  useDocumentById,
  useCompletedDocuments,
  useProcessingDocuments,
  useLabeledChunks,
  useTaxonomyStatsQuery,
  documentsQueryKey,
  labeledChunksQueryKey,
  taxonomyStatsQueryKey,
  // Job Polling
  useJobStatusPolling,
  useStartJob,
  useJobWithPolling,
  jobStatusQueryKey,
  // Payment History
  usePaymentHistoryQuery,
  useMyPaymentHistory,
  usePaymentHistoryByType,
  paymentHistoryQueryKey,
  // Dashboard
  useDashboardData,
  useDashboardRequiresWallet,
  useRefreshDashboard,
} from "./queries";

// Mutation Hooks
export {
  // Chat
  useSendChatMessage,
  useChatHistory,
  // Data Rooms
  useCreateDataRoom,
  useUpdateDataRoom,
  useDeleteDataRoom,
  // Subscriptions
  useSubscribeDataRoom,
  useCheckSubscription,
  useCancelSubscription,
  // Documents
  useIngestDocument,
  useBatchIngestDocuments,
  useDeleteDocument,
} from "./mutations";

// Web3 Hooks
export {
  usePaymentHeader,
  useMicrosubSelection,
  useAgentSelection,
  type UsePaymentHeaderReturn,
  type MicrosubInfo,
  type MicrosubInfoWithDisabled,
} from "./web3";

// Auth Hooks
export { useAuth, default as useAuthDefault } from "./useAuth";

// Subdomain Org Auto-Switch
export {
  useAutoOrgSwitch,
  default as useAutoOrgSwitchDefault,
  type AccessStatus,
} from "./useAutoOrgSwitch";
