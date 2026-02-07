# Onchain x402 Alignment

Align unified-webapp x402 header creation with the updated Onchain docs and
add mocked hyperblog purchase coverage.

## Completed Tasks

- [x] Add/adjust hyperblog e2e mocks/tests
- [x] Rework x402 header creation + intermediaries

## In Progress Tasks

- [ ] None

## Future Tasks

- [ ] None

## Implementation Plan

1. Update x402 header builder to ERC-3009 + base64 header string
2. Centralize intermediary address selection for signing
3. Add hyperblog purchase e2e test + mocks

### Relevant Files

- `src/hooks/web3/usePaymentHeader.ts` - x402 header signing hook ✅
- `src/lib/payment/build-payment-header.ts` - ERC-3009 typed data + header encoding ✅
- `src/lib/payment/types.ts` - x402/typed data type definitions ✅
- `src/components/hyperblogs/create-blog.tsx` - hyperblog purchase flow ✅
- `e2e/hyperblogs.spec.ts` - hyperblog purchase e2e coverage ✅
- `e2e/utils/mockApi.ts` - hyperblog purchase mock API responses ✅

# Unified Dashboard and Search SSR Fix

Implementation tasks for the unified dashboard work and the WebGL SSR fix.

## Completed Tasks

- [x] Implement unified dashboard sections and page
- [x] Add payment history API route and query hooks
- [x] Fix WebGL2 SSR issue on `/search` with client-only GraphExplorer
- [x] Fix WebGL2 SSR issue on `/graph` with client-only GraphExplorer

## In Progress Tasks

- [ ] Validate navigation and quick actions manually in UI
- [ ] Resolve TypeScript errors in documents page
- [ ] Resolve TypeScript errors in graph wiki panel
- [ ] Resolve missing TaxonomyStatsResponse export

## Future Tasks

- [ ] Add dashboard document aggregation across bonfires
- [ ] Add retry handling for payment history filters

## Implementation Plan

- Dashboard aggregates independent sections with per-section loading and errors.
- Search page uses client-only GraphExplorer to avoid SSR WebGL issues.

### Relevant Files

- `src/app/dashboard/page.tsx` - Dashboard layout and section composition ✅
- `src/hooks/queries/useDashboardData.ts` - Aggregated dashboard data hook ✅
- `src/components/dashboard/*` - Dashboard sections and skeletons ✅
- `src/app/(graph)/search/page.tsx` - Client-only graph search rendering ✅
- `src/app/documents/page.tsx` - Documents page summary + pagination logic
- `src/components/graph/WikiPanel.tsx` - Wiki panel edge detail rendering
- `src/types/index.ts` - Central type exports
