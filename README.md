# Delve Unified Webapp

Unified platform combining graph visualization, Web3 features, and document management for the Delve knowledge graph platform.

## Tech Stack

- **Framework**: Next.js 16.0.10 (App Router)
- **React**: 19.0.1
- **TypeScript**: 5.9+
- **Styling**: Tailwind CSS 4.x + DaisyUI 5.x
- **State Management**:
  - React Query 5.x (server state)
  - Zustand 5.x (client state)
- **Web3**:
  - RainbowKit 2.2.8
  - Wagmi 2.16.4
  - Viem 2.34.0
- **Graph Visualization**:
  - Sigma.js 3.0.0
  - Graphology 0.26.0

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `NEXT_PUBLIC_DELVE_API_URL` - Backend API URL
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID

## Project Structure

```
unified-webapp/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (marketing)/        # Marketing pages (landing)
│   │   ├── (graph)/            # Graph features
│   │   ├── (web3)/             # Web3 features
│   │   ├── documents/          # Document management
│   │   ├── dashboard/          # User dashboard
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── common/             # Basic UI components
│   │   ├── shared/             # Shared feature components
│   │   ├── graph/              # Graph visualization
│   │   └── web3/               # Web3 components
│   ├── hooks/
│   │   ├── queries/            # React Query hooks
│   │   └── mutations/          # Mutation hooks
│   ├── lib/
│   │   ├── api/                # API client
│   │   └── storage/            # localStorage utilities
│   ├── contexts/               # React contexts
│   └── types/                  # TypeScript types
├── public/                     # Static assets
└── ...config files
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |

## Features

- **Graph Explorer**: Interactive knowledge graph visualization
- **Data Rooms**: Web3-powered monetized knowledge spaces
- **AI Agents**: Chat with context-aware AI agents
- **Documents**: Upload and process documents
- **HyperBlogs**: AI-generated blog posts from knowledge graphs
- **Dashboard**: Unified view of user activity

## Architecture

### Provider Hierarchy

```
QueryClientProvider (React Query)
└── WagmiProvider
    └── QueryClientProvider (Web3)
        └── RainbowKitProvider
            └── App
```

### API Integration

- Simple queries go directly to API routes
- Long-running queries use async job polling pattern
- ApiClient handles caching and request deduplication
- React Query handles query-level caching

## License

MIT
