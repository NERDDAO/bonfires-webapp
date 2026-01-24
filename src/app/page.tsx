import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Delve
            </h1>
            <p className="py-6 text-xl text-base-content/80">
              Explore, visualize, and interact with knowledge graphs. Create
              data rooms, generate hyperblogs, and leverage AI agents for
              intelligent discovery.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/graph" className="btn btn-primary btn-lg">
                Explore Graph
              </Link>
              <Link href="/documents" className="btn btn-outline btn-lg">
                Manage Documents
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 bg-base-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Graph Explorer */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">
                  <span className="text-2xl">🔍</span>
                  Graph Explorer
                </h3>
                <p className="text-base-content/70">
                  Visualize and navigate complex knowledge graphs with
                  interactive exploration tools.
                </p>
              </div>
            </div>

            {/* Data Rooms */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">
                  <span className="text-2xl">🏠</span>
                  Data Rooms
                </h3>
                <p className="text-base-content/70">
                  Create and monetize curated knowledge spaces with Web3-powered
                  access control.
                </p>
              </div>
            </div>

            {/* AI Agents */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">
                  <span className="text-2xl">🤖</span>
                  AI Agents
                </h3>
                <p className="text-base-content/70">
                  Chat with specialized AI agents that understand your knowledge
                  graph context.
                </p>
              </div>
            </div>

            {/* Document Management */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">
                  <span className="text-2xl">📄</span>
                  Documents
                </h3>
                <p className="text-base-content/70">
                  Upload and process documents to automatically extract and
                  structure knowledge.
                </p>
              </div>
            </div>

            {/* HyperBlogs */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">
                  <span className="text-2xl">✍️</span>
                  HyperBlogs
                </h3>
                <p className="text-base-content/70">
                  Generate AI-powered blog posts from your knowledge graph data.
                </p>
              </div>
            </div>

            {/* Dashboard */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">
                  <span className="text-2xl">📊</span>
                  Dashboard
                </h3>
                <p className="text-base-content/70">
                  View your activity, data rooms, documents, and payment history
                  in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
