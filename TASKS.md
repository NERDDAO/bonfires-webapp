# Unified Dashboard and Search SSR Fix

Implementation tasks for the unified dashboard work and the WebGL SSR fix.

## Completed Tasks

- [x] Implement unified dashboard sections and page
- [x] Add payment history API route and query hooks
- [x] Fix WebGL2 SSR issue on `/search` with client-only GraphExplorer
- [x] Fix WebGL2 SSR issue on `/graph` with client-only GraphExplorer

## In Progress Tasks

- [ ] Validate navigation and quick actions manually in UI

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
