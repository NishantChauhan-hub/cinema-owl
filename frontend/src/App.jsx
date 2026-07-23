import React, { useState, useEffect, useMemo } from "react";
import { Search, X, Bookmark, Activity } from "lucide-react";
import { TABS } from "./constants";
import { apiFetch, SESSION_ID } from "./utils";

// Pages
import BrowsePage  from "./pages/BrowsePage";
import DetailPage  from "./pages/DetailPage";
import GenrePage   from "./pages/GenrePage";
import WatchedPage from "./pages/WatchedPage";

// Components
import Footer     from "./components/Footer";
import ChatWidget from "./components/ChatWidget";

/**
 * App root — owns all top-level state and renders the correct page.
 *
 * State layout:
 *  - activeTab   → which content type is selected (movie | show | anime)
 *  - activePage  → which page is shown (browse | mylist | genre)
 *  - view        → when activePage=browse, either { page:"browse" } or { page:"detail", item }
 *  - genreState  → { id, name, type } — the active genre page params
 *  - query       → search bar string
 *  - listMap     → Map<titleId, entry> — My List, synced with backend
 *  - chatOpen    → controls the chat widget visibility
 *  - pendingPrompt → pre-filled chat message (set by DetailPage's "Ask Owl" button)
 */
export default function App() {
  const [activeTab,     setActiveTab]     = useState("movie");
  const [activePage,    setActivePage]    = useState("browse");
  const [view,          setView]          = useState({ page: "browse", item: null });
  const [genreState,    setGenreState]    = useState(null);
  const [query,         setQuery]         = useState("");
  const [chatOpen,      setChatOpen]      = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState(null);

  // My List — stored as a Map for O(1) lookups
  const [listMap, setListMap] = useState(new Map());
  const listIds  = useMemo(() => new Set(listMap.keys()),       [listMap]);
  const listData = useMemo(() => Array.from(listMap.values()), [listMap]);

  // Load My List from backend on first mount
  useEffect(() => {
    apiFetch(`/watched/${SESSION_ID}`).then(data => {
      if (data?.watched) {
        const m = new Map();
        data.watched.forEach(w => m.set(w.title_id, w));
        setListMap(m);
      }
    });
  }, []);

  // ── List management ──────────────────────────────────────────────────────────
  function toggleList(item) {
    const alreadyIn = listIds.has(item.id);

    if (alreadyIn) {
      // Optimistic remove
      setListMap(prev => { const next = new Map(prev); next.delete(item.id); return next; });
      apiFetch("/watched", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: SESSION_ID, titleId: item.id }),
      });
    } else {
      // Optimistic add
      const entry = {
        title_id:   item.id,
        title_type: item.type,
        title_name: item.title,
        poster_url: item.poster || null,
        tmdb_id:    item.tmdbId || item.malId || null,
      };
      setListMap(prev => { const next = new Map(prev); next.set(item.id, entry); return next; });
      apiFetch("/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          titleId:   item.id,
          titleType: item.type,
          titleName: item.title,
          posterUrl: item.poster || null,
          tmdbId:    item.tmdbId || item.malId || null,
        }),
      });
    }
  }

  // ── Navigation helpers ───────────────────────────────────────────────────────
  function openDetail(item) {
    setView({ page: "detail", item });
    setActivePage("browse");
    window.scrollTo(0, 0);
  }

  function backToBrowse() {
    setView({ page: "browse", item: null });
  }

  function navigateToGenre(id, name, type) {
    setGenreState({ id, name, type });
    setActivePage("genre");
    setView({ page: "browse", item: null });
    window.scrollTo(0, 0);
  }

  function switchTab(tabId) {
    setActiveTab(tabId);
    setView({ page: "browse", item: null });
    setActivePage("browse");
    setQuery("");
  }

  const isDetailPage = activePage === "browse" && view.page === "detail" && view.item;

  return (
    <div className="scanline" style={{ minHeight: "100vh", background: "var(--void)" }}>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>

          {/* Brand / logo — clicking goes home */}
          <div className="brand" onClick={() => { backToBrowse(); setActivePage("browse"); }}>
            🦉 <span>CinemaOwl</span>
          </div>

          {/* Content type tabs (Movies, Shows, Anime) */}
          <div style={{ display: "flex", gap: 2, marginLeft: 6 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id && activePage === "browse" && view.page === "browse" ? "nav-tab-active" : ""}`}
                onClick={() => switchTab(tab.id)}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          {/* My List tab */}
          <button
            className={`nav-tab ${activePage === "mylist" ? "nav-tab-active" : ""}`}
            onClick={() => setActivePage("mylist")}
          >
            <Bookmark size={13} />
            My List
            {listData.length > 0 && (
              <span style={{ background: "var(--cyan)", color: "#030308", borderRadius: "99px", fontSize: 9, fontWeight: 800, padding: "1px 6px", marginLeft: 1 }}>
                {listData.length}
              </span>
            )}
          </button>

          <div style={{ flex: 1 }} />

          <div className="ai-badge" style={{ flexShrink: 0 }}><Activity size={9} /> GEMINI</div>

          {/* Search */}
          <div className="search-wrap" style={{ width: 200 }}>
            <Search size={13} color="var(--text-dim)" />
            <input
              placeholder="search…"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setView({ page: "browse", item: null });
                setActivePage("browse");
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ color: "var(--text-dim)", display: "flex" }}>
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 0" }}>

        {activePage === "mylist" && (
          <WatchedPage listData={listData} onToggleList={toggleList} onOpen={openDetail} />
        )}

        {activePage === "genre" && genreState && (
          <GenrePage
            genreId={genreState.id} genreName={genreState.name} kind={genreState.type}
            onOpen={openDetail} inList={listIds} onToggleList={toggleList}
            onBack={() => setActivePage("browse")}
          />
        )}

        {activePage === "browse" && !isDetailPage && (
          <BrowsePage
            activeTab={activeTab} onOpen={openDetail}
            inList={listIds} onToggleList={toggleList}
            query={query} onOpenChat={() => setChatOpen(true)}
            onGenreClick={navigateToGenre}
          />
        )}

        {isDetailPage && (
          <DetailPage
            item={view.item} onBack={backToBrowse}
            inList={listIds} onToggleList={toggleList}
            onAskOwl={prompt => { setPendingPrompt(prompt); setChatOpen(true); }}
            onGenreClick={navigateToGenre}
          />
        )}
      </div>

      {/* ── Footer (hidden on detail page) ──────────────────────────────────── */}
      {!isDetailPage && <Footer onGenreClick={navigateToGenre} />}

      {/* ── Chat widget ─────────────────────────────────────────────────────── */}
      <ChatWidget
        open={chatOpen} setOpen={setChatOpen}
        pendingPrompt={pendingPrompt} setPendingPrompt={setPendingPrompt}
      />
    </div>
  );
}
