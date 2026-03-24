"use client";

/**
 * Trimtab Viewer — Surveillance-noir live view into a Bonfires AI agent's mind.
 *
 * Single-agent mode: ?agent=AGENT_ID — polls GET {apiBase}/trimtabs/{agentId}
 * Cluster mode: ?cluster=CLUSTER_ID — unified feed from multiple agents
 *
 * The feed uses direct DOM manipulation via ref for staggered typewriter
 * animation; sidebar panels render declaratively with React.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";

import { useClusterTrimtab } from "@/hooks/queries/useClusterTrimtab";
import type { TrimtabData, TrimtabNote } from "@/hooks/queries/useClusterTrimtab";

import "./trimtab.css";

// ---------------------------------------------------------------------------
// Types (single-agent mode uses local interfaces kept for backward compat)
// ---------------------------------------------------------------------------

interface LeaderboardEntry {
  name: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 5000;
const MAX_FEED_LINES = 20;
const MAX_SIDEBAR_NOTES = 8;

const AGENT_COLORS = ["#f5572a", "#4ecdc4", "#ffe66d", "#a8e6cf", "#ff6b6b", "#c4b5fd"];

// ---------------------------------------------------------------------------
// Helpers (pure functions ported from the HTML)
// ---------------------------------------------------------------------------

function getAgentColor(agents: { agentId: string }[], agentId: string): string {
  const idx = agents.findIndex((a) => a.agentId === agentId);
  return AGENT_COLORS[idx % AGENT_COLORS.length] ?? AGENT_COLORS[0]!;
}

function classifyNote(content: string): string {
  if (content.startsWith("STATUS")) return "signal-burst";
  if (content.startsWith("TRACK REVIEW")) return "phase-shift";
  if (content.startsWith("LIGHT")) return "";
  if (content.includes("PURGE") || content.includes("RESTORATION"))
    return "signal-burst";
  return "";
}

function formatNoteContent(content: string): string {
  const safe = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return (
    safe
      // Scores: 87/100
      .replace(/(\d+)\/100/g, (_match, score: string) => {
        const n = parseInt(score, 10);
        const cls = n >= 80 ? "score-high" : n >= 60 ? "score-mid" : "score-low";
        return `<span class="${cls}">${score}</span>/100`;
      })
      // Phase values
      .replace(
        /phase:(\w+)/g,
        'phase:<span class="emphasis">$1</span>',
      )
      // Pipe-delimited keys
      .replace(/(\w+):(\d+)/g, '$1:<span class="num">$2</span>')
      // Project names after LIGHT |
      .replace(
        /^LIGHT \| (.+?) \|/,
        'LIGHT | <span class="project-name">$1</span> |',
      )
      // STATUS prefix
      .replace(/^STATUS/, '<span class="conviction">STATUS</span>')
      // TRACK REVIEW prefix
      .replace(
        /^TRACK REVIEW/,
        '<span class="conviction">TRACK REVIEW</span>',
      )
  );
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getNoteType(content: string): string {
  if (content.startsWith("STATUS")) return "status";
  if (content.startsWith("TRACK REVIEW")) return "track";
  if (content.startsWith("LIGHT")) return "light";
  return "note";
}

function parseLeaderboard(notes: TrimtabNote[]): LeaderboardEntry[] {
  const projects: LeaderboardEntry[] = [];
  for (const note of notes) {
    const match = note.content.match(/^LIGHT \| (.+?) \| (\d+)\/100/);
    if (match) {
      projects.push({ name: match[1] ?? "", score: parseInt(match[2] ?? "0", 10) });
    }
  }
  projects.sort((a, b) => b.score - a.score);
  return projects;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Inner component that uses useSearchParams (must be inside Suspense)
// ---------------------------------------------------------------------------

function TrimtabViewerInner() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent");
  const clusterId = searchParams.get("cluster");
  const isClusterMode = !!clusterId;
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  // --- Cluster hook (always called, inactive when clusterId is null) ---
  const cluster = useClusterTrimtab(isClusterMode && isSignedIn ? clusterId : null);

  // --- State (single-agent mode) ---
  const [data, setData] = useState<TrimtabData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- State (cluster sidebar) ---
  const [selectedSidebarAgent, setSelectedSidebarAgent] = useState<string | null>(null);

  // Auto-select first agent when cluster agents resolve
  useEffect(() => {
    if (isClusterMode && cluster.agents.length > 0 && selectedSidebarAgent === null) {
      setSelectedSidebarAgent(cluster.agents[0]!.agentId);
    }
  }, [isClusterMode, cluster.agents, selectedSidebarAgent]);

  // --- Refs ---
  const feedRef = useRef<HTMLDivElement>(null);
  const seenNoteIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // --- Feed DOM manipulation ---
  const updateFadeClasses = useCallback(() => {
    const container = feedRef.current;
    if (!container) return;
    const lines = container.querySelectorAll(".feed-line");
    const count = lines.length;
    lines.forEach((line, i) => {
      for (let f = 1; f <= 9; f++) line.classList.remove("fade-" + f);
      const fromBottom = count - 1 - i;
      if (fromBottom >= 9) line.classList.add("fade-1");
      else if (fromBottom >= 1) line.classList.add("fade-" + (10 - fromBottom));
    });
  }, []);

  const addNoteFeedLine = useCallback(
    (note: TrimtabNote, agentBadgeHtml?: string) => {
      const container = feedRef.current;
      if (!container) return;

      const el = document.createElement("div");
      const type = classifyNote(note.content);
      el.className = "feed-line" + (type ? " " + type : "");

      const ts = formatTime(note.createdAt);
      let inner = "";
      if (ts) inner += `<span class="ts">${ts}</span>`;
      if (agentBadgeHtml) inner += agentBadgeHtml;
      inner += `<span class="thought">${formatNoteContent(note.content)}</span>`;
      el.innerHTML = inner;

      container.appendChild(el);

      // Trim to max lines
      while (container.children.length > MAX_FEED_LINES) {
        container.removeChild(container.firstChild!);
      }

      updateFadeClasses();
    },
    [updateFadeClasses],
  );

  // --- Flicker observer (every 5th line) ---
  useEffect(() => {
    const container = feedRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      const lines = container.querySelectorAll(".feed-line");
      lines.forEach((line, i) => {
        const el = line as HTMLElement;
        if ((i + 1) % 5 === 0 && !el.dataset["flickerApplied"]) {
          el.style.animation =
            "trimtab-typeIn 0.4s forwards, trimtab-lineFlicker 17s 3s infinite";
          el.dataset["flickerApplied"] = "true";
        }
      });
    });

    observer.observe(container, { childList: true });
    return () => observer.disconnect();
  }, []);

  // --- Polling (single-agent mode only) ---
  useEffect(() => {
    if (!agentId || isClusterMode) return;

    let cancelled = false;

    async function fetchTrimtab() {
      try {
        const res = await fetch(`/api/trimtab/${agentId}`);
        if (cancelled) return;

        if (!res.ok) {
          if (!data) setFetchError(`Failed to load trimtab: ${res.status}`);
          return;
        }

        const newData: TrimtabData = await res.json();
        if (cancelled) return;

        setData(newData);
        setFetchError(null);

        // Feed: inject new notes we haven't seen
        const newNotes: TrimtabNote[] = [];
        for (const note of newData.notes) {
          const noteId = note.id || note.noteId;
          if (noteId && !seenNoteIds.current.has(noteId)) {
            seenNoteIds.current.add(noteId);
            newNotes.push(note);
          }
        }

        const container = feedRef.current;
        if (!container) return;

        // First load: show last N notes as initial burst
        if (!initialLoadDone.current && container.children.length === 0) {
          initialLoadDone.current = true;
          const initial = newData.notes.slice(-MAX_FEED_LINES);
          let delay = 0;
          for (const note of initial) {
            setTimeout(() => {
              if (!cancelled) addNoteFeedLine(note);
            }, delay);
            delay += 150;
          }
        } else {
          // Subsequent polls: stagger new notes
          let delay = 0;
          for (const note of newNotes) {
            setTimeout(() => {
              if (!cancelled) addNoteFeedLine(note);
            }, delay);
            delay += 300;
          }
        }
      } catch (err) {
        console.error("Trimtab fetch error:", err);
      }
    }

    fetchTrimtab();
    const interval = setInterval(fetchTrimtab, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // data is intentionally excluded — we only read it to check initial error state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, isClusterMode, addNoteFeedLine]);

  // --- Cluster mode: feed rendering ---
  useEffect(() => {
    if (!isClusterMode) return;

    const notes = cluster.mergedNotes;
    if (notes.length === 0) return;

    const container = feedRef.current;
    if (!container) return;

    // First load: show last N notes as initial burst
    if (!initialLoadDone.current && container.children.length === 0) {
      initialLoadDone.current = true;
      const initial = notes.slice(-MAX_FEED_LINES);
      let delay = 0;
      for (const note of initial) {
        const noteId = note.id || note.noteId;
        if (noteId) seenNoteIds.current.add(noteId);
        const color = note.agentId ? getAgentColor(cluster.agents, note.agentId) : AGENT_COLORS[0];
        const badge = `<span class="agent-badge" style="color: ${color}">[${escapeHtml(note.agentName ?? "unknown")}]</span> `;
        setTimeout(() => {
          addNoteFeedLine(note, badge);
        }, delay);
        delay += 150;
      }
      return;
    }

    // Subsequent updates: inject only new notes
    const newNotes: TrimtabNote[] = [];
    for (const note of notes) {
      const noteId = note.id || note.noteId;
      if (noteId && !seenNoteIds.current.has(noteId)) {
        seenNoteIds.current.add(noteId);
        newNotes.push(note);
      }
    }

    let delay = 0;
    for (const note of newNotes) {
      const color = note.agentId ? getAgentColor(cluster.agents, note.agentId) : AGENT_COLORS[0];
      const badge = `<span class="agent-badge" style="color: ${color}">[${escapeHtml(note.agentName ?? "unknown")}]</span> `;
      setTimeout(() => {
        addNoteFeedLine(note, badge);
      }, delay);
      delay += 300;
    }
  }, [isClusterMode, cluster.mergedNotes, cluster.agents, addNoteFeedLine]);

  // --- Derived sidebar data ---
  const sidebarData: TrimtabData | null = isClusterMode
    ? (selectedSidebarAgent ? cluster.agentData.get(selectedSidebarAgent) ?? null : null)
    : data;

  const leaderboard = useMemo(
    () => (sidebarData ? parseLeaderboard(sidebarData.notes) : []),
    [sidebarData],
  );

  const recentNotes = useMemo(
    () => (sidebarData ? sidebarData.notes.slice(-MAX_SIDEBAR_NOTES).reverse() : []),
    [sidebarData],
  );

  const phase = useMemo(() => {
    if (!sidebarData) return null;
    const statusNote = sidebarData.notes.find((n) => n.content.startsWith("STATUS"));
    if (!statusNote) return null;
    const match = statusNote.content.match(/phase:(\w+)/);
    return match?.[1]?.replace(/_/g, " ") ?? null;
  }, [sidebarData]);

  const currentTrack = useMemo(() => {
    if (!sidebarData) return null;
    const statusNote = sidebarData.notes.find((n) => n.content.startsWith("STATUS"));
    if (!statusNote) return null;
    const match = statusNote.content.match(/current:([^|]+)/);
    return match?.[1]?.trim() ?? null;
  }, [sidebarData]);

  const updatedTime = useMemo(() => {
    if (!sidebarData?.updatedAt) return null;
    return new Date(sidebarData.updatedAt).toLocaleString();
  }, [sidebarData]);

  const shortAgentId = useMemo(() => {
    if (!agentId) return "";
    return agentId.substring(0, 6) + ".." + agentId.substring(agentId.length - 4);
  }, [agentId]);

  // --- Cluster stats ---
  const clusterTotalNotes = useMemo(() => {
    if (!isClusterMode) return 0;
    let total = 0;
    for (const [, agentTrimtab] of cluster.agentData) {
      total += agentTrimtab.notes.length;
    }
    return total;
  }, [isClusterMode, cluster.agentData]);

  // --- No agent/cluster specified error ---
  if (!agentId && !clusterId) {
    return (
      <div className="trimtab-viewer">
        <div className="error-state">
          <span className="thought">
            <span className="conviction">no agent specified.</span> add
            ?agent=AGENT_ID or ?cluster=CLUSTER_ID to the URL
          </span>
        </div>
      </div>
    );
  }

  // --- Cluster sign-in required ---
  if (isClusterMode && (!userLoaded || !isSignedIn)) {
    return (
      <div className="trimtab-viewer">
        <div className="error-state">
          <span className="thought">
            <span className="conviction">sign in required.</span> cluster view needs authentication.
          </span>
          {userLoaded && (
            <SignInButton mode="modal">
              <button
                style={{
                  marginTop: 16,
                  background: "var(--ember)",
                  color: "var(--text)",
                  border: "none",
                  padding: "8px 20px",
                  fontFamily: "'Montserrat', sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    );
  }

  // --- Cluster loading state ---
  if (isClusterMode && cluster.isLoading) {
    return (
      <div className="trimtab-viewer">
        <div className="error-state">
          <span className="thought">resolving cluster agents...</span>
        </div>
      </div>
    );
  }

  // --- Cluster error state ---
  if (isClusterMode && cluster.error) {
    return (
      <div className="trimtab-viewer">
        <div className="error-state">
          <span className="thought">
            <span className="conviction">cluster error.</span> {cluster.error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="trimtab-viewer">
      <div className="vignette" />
      <div className="h-band" />

      <div className="shell">
        {/* TOP BAR */}
        <div className="top-bar">
          <span className="brand">Trimtab</span>
          <span className="sep">{"\u2502"}</span>
          {isClusterMode ? (
            <>
              <span className="agent-name">
                {cluster.clusterName ?? "loading..."}
              </span>
              <span className="sep">{"\u2502"}</span>
              <span className="meta">
                Cluster &middot; {cluster.agents.length} agent{cluster.agents.length !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <>
              <span className="agent-name">
                {data?.agentName ?? "loading..."}
              </span>
              <span className="sep">{"\u2502"}</span>
              <span className="meta">{currentTrack ?? ""}</span>
              {phase && <span className="phase-badge">{phase}</span>}
            </>
          )}
          <div className="live-indicator">
            <div className="live-dot" />
            <span className="live-text">Transmitting</span>
          </div>
        </div>

        {/* FEED */}
        <div className="feed-zone">
          <div className="feed-container" ref={feedRef}>
            {!isClusterMode && fetchError && !data && (
              <div className="feed-line" style={{ opacity: 1 }}>
                <span className="thought">
                  <span className="uncertainty">{fetchError}</span>
                </span>
              </div>
            )}
          </div>
          <div className="cursor-line">
            <span className="cursor-block" />
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="sidebar">
          {/* Cluster mode: Agent selector + feed filters */}
          {isClusterMode && cluster.agents.length > 0 && (
            <div className="panel cluster-controls">
              <div className="cluster-agent-select">
                <span className="cluster-label">SIDEBAR</span>
                <select
                  className="cluster-dropdown"
                  value={selectedSidebarAgent ?? ""}
                  onChange={(e) => setSelectedSidebarAgent(e.target.value || null)}
                >
                  {cluster.agents.map((agent, i) => (
                    <option key={agent.agentId} value={agent.agentId}>
                      {agent.agentName}
                    </option>
                  ))}
                </select>
              </div>
              <details className="cluster-feed-details">
                <summary className="cluster-feed-summary">
                  <span className="cluster-label">FEED</span>
                  <span className="cluster-feed-count">
                    {cluster.enabledAgentIds.size}/{cluster.agents.length} agents
                  </span>
                </summary>
                <div className="cluster-feed-list">
                  {cluster.agents.map((agent, i) => (
                    <label key={agent.agentId} className="cluster-feed-item">
                      <input
                        type="checkbox"
                        checked={cluster.enabledAgentIds.has(agent.agentId)}
                        onChange={() => cluster.toggleAgent(agent.agentId)}
                      />
                      <span style={{ color: AGENT_COLORS[i % AGENT_COLORS.length] }}>{agent.agentName}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Mind */}
          <div className="panel">
            <div className="panel-header">
              <span>Mind</span>
            </div>
            <div className="mind-grid">
              <div className="mind-metric">
                <span className="mind-label">Agent</span>
                <span className="mind-value current-name">
                  {sidebarData?.agentName ?? "loading..."}
                </span>
              </div>
              <div className="mind-metric">
                <span className="mind-label">Notes</span>
                <span className="mind-value primary">
                  {sidebarData ? sidebarData.notes.length : "\u2014"}
                </span>
              </div>
              <div className="mind-metric">
                <span className="mind-label">Quests</span>
                <span className="mind-value" style={{ color: "var(--text)" }}>
                  {sidebarData ? sidebarData.quests.length : 0}
                </span>
              </div>
              <div className="mind-metric">
                <span className="mind-label">Tasks</span>
                <span className="mind-value" style={{ color: "var(--text)" }}>
                  {sidebarData ? sidebarData.tasks.length : 0}
                </span>
              </div>
              <div className="mind-metric full">
                <span className="mind-label">Last Updated</span>
                <span className="mind-sub">{updatedTime ?? "\u2014"}</span>
              </div>
            </div>
          </div>

          {/* Leaderboard (from LIGHT notes) */}
          {leaderboard.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <span>Leaderboard</span>
                <span className="count">
                  {leaderboard.length} projects
                </span>
              </div>
              <div className="score-list">
                {leaderboard.map((entry, i) => {
                  const isTop = i < 3;
                  return (
                    <div
                      key={entry.name}
                      className={`score-row${i === 0 ? " reviewing" : ""}`}
                    >
                      <span className="score-rank">{i + 1}</span>
                      <span className="score-name">{entry.name}</span>
                      <div className="score-bar-mini">
                        <div
                          className={`score-bar-fill${isTop ? " top" : ""}`}
                          style={{ width: `${entry.score}%` }}
                        />
                      </div>
                      <span className={`score-num${isTop ? " top" : ""}`}>
                        {entry.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="panel">
            <div className="panel-header">
              <span>Notes</span>
              <span className="count">{sidebarData ? sidebarData.notes.length : 0}</span>
            </div>
            <div className="notes-list">
              {recentNotes.map((note, i) => {
                const type = getNoteType(note.content);
                const ts = formatTime(note.createdAt);
                const isActive = i === 0;
                const safe = escapeHtml(note.content);
                const noteKey = note.id || note.noteId || `note-${i}`;

                return (
                  <div
                    key={noteKey}
                    className={`note-entry${isActive ? " active" : ""}`}
                  >
                    <div className="note-type-row">
                      <span className={`note-type ${type}`}>{type}</span>
                      <span className="note-time">{ts}</span>
                    </div>
                    <span className="note-content">
                      {safe.substring(0, 120)}
                      {safe.length > 120 ? "..." : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="status-bar">
          {isClusterMode ? (
            <>
              <span>CLUSTER {cluster.clusterName?.toUpperCase() ?? "\u2014"}</span>
              <span className="sep">{"\u2502"}</span>
              <span>
                AGENTS{" "}
                <span className="s-val">
                  {cluster.enabledAgentIds.size}/{cluster.agents.length}
                </span>
              </span>
              <span style={{ marginLeft: "auto" }}>
                NOTES{" "}
                <span className="s-val">{clusterTotalNotes}</span>
              </span>
            </>
          ) : (
            <>
              <span>AGENT {shortAgentId || "\u2014"}</span>
              <span className="sep">{"\u2502"}</span>
              <span>
                {data?.updatedAt
                  ? `UPDATED ${formatTime(data.updatedAt)}`
                  : "\u2014"}
              </span>
              <span style={{ marginLeft: "auto" }}>
                NOTES{" "}
                <span className="s-val">{data ? data.notes.length : 0}</span>
              </span>
              <span>
                QUESTS{" "}
                <span className="s-val">{data ? data.quests.length : 0}</span>
              </span>
              <span>
                TASKS{" "}
                <span className="s-val">{data ? data.tasks.length : 0}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported page — wraps inner component in Suspense (required by useSearchParams)
// ---------------------------------------------------------------------------

export default function TrimtabPage() {
  return (
    <Suspense
      fallback={
        <div className="trimtab-viewer">
          <div className="error-state">
            <span className="thought">loading...</span>
          </div>
        </div>
      }
    >
      <TrimtabViewerInner />
    </Suspense>
  );
}
