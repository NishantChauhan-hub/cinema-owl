import React, { useState, useEffect, useMemo, useContext } from "react";
import { Search, X, Bookmark, Activity, Moon, Sun, User as UserIcon } from "lucide-react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { TABS } from "./constants";
import { apiFetch } from "./utils";
import { AuthContext } from "./context/AuthContext";

// Pages
import BrowsePage  from "./pages/BrowsePage";
import DetailPage  from "./pages/DetailPage";
import GenrePage   from "./pages/GenrePage";
import WatchedPage from "./pages/WatchedPage";
import AuthPage    from "./pages/AuthPage";

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
  const [theme,         setTheme]         = useState(localStorage.getItem("theme") || "dark");
  const [toast,         setToast]         = useState(null);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // My List — stored as a Map for O(1) lookups
  const [listMap, setListMap] = useState(new Map());
  const listIds  = useMemo(() => new Set(listMap.keys()),       [listMap]);
  const listData = useMemo(() => Array.from(listMap.values()), [listMap]);

  // Load My List from backend when user logs in
  useEffect(() => {
    if (user) {
      apiFetch(`/watched`).then(data => {
        if (data?.watched) {
          const m = new Map();
          data.watched.forEach(w => m.set(w.title_id, w));
          setListMap(m);
        }
      });
    } else {
      setListMap(new Map());
    }
  }, [user]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── List management ──────────────────────────────────────────────────────────
  function toggleList(item) {
    if (!user) {
      showToast("Login required to save shows!");
      return;
    }

    const alreadyIn = listIds.has(item.id);

    if (alreadyIn) {
      // Optimistic remove
      setListMap(prev => { const next = new Map(prev); next.delete(item.id); return next; });
      apiFetch("/watched", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: item.id }),
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
    navigate("/");
    window.scrollTo(0, 0);
  }

  function backToBrowse() {
    setView({ page: "browse", item: null });
    navigate("/");
  }

  function navigateToGenre(id, name, type) {
    setGenreState({ id, name, type });
    navigate("/genre");
    window.scrollTo(0, 0);
  }

  function switchTab(tabId) {
    setActiveTab(tabId);
    setView({ page: "browse", item: null });
    navigate("/");
    setQuery("");
  }

  const isDetailPage = activePage === "browse" && view.page === "detail" && view.item;

  return (
    <div className="scanline" style={{ minHeight: "100vh", background: "var(--void)" }}>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>

          {/* Brand / logo — clicking goes home */}
          <div className="brand" onClick={() => { backToBrowse(); setActivePage("browse"); }}>
            🦉 <span>CinemaOwl</span>
          </div>

          {/* Content type tabs (Movies, Shows, Anime) */}
          <div className="nav-tabs-container" style={{ display: "flex", gap: 2, marginLeft: 6 }}>
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
            className={`nav-tab ${location.pathname === "/mylist" ? "nav-tab-active" : ""}`}
            onClick={() => {
              if (!user) { showToast("Login required to view your list!"); navigate("/login"); return; }
              navigate("/mylist");
            }}
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
          
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="icon-btn" style={{ flexShrink: 0, border: "1px solid var(--border)", background: "var(--panel)" }}>
            {theme === "dark" ? <Sun size={14} color="var(--text-muted)" /> : <Moon size={14} color="var(--text-muted)" />}
          </button>
          
          {user ? (
            <button onClick={() => { logout(); navigate("/"); }} className="nav-tab" style={{ background: "rgba(255,0,110,0.1)", color: "var(--magenta)" }}>
              Logout
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="nav-tab" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
              <UserIcon size={13} /> Login
            </button>
          )}

          <div className="ai-badge" style={{ flexShrink: 0, marginLeft: 8 }}><Activity size={9} /> GEMINI</div>

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
        {toast && (
          <div className="fade-up" style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: "rgba(255,0,110,0.1)", color: "var(--magenta)", border: "1px solid rgba(255,0,110,0.3)", padding: "10px 20px", borderRadius: 99, fontWeight: 600, fontSize: 13, backdropFilter: "blur(10px)" }}>
            {toast}
          </div>
        )}

        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          
          <Route path="/mylist" element={
            <WatchedPage listData={listData} onToggleList={toggleList} onOpen={openDetail} />
          } />
          
          <Route path="/genre" element={
            genreState ? (
              <GenrePage
                genreId={genreState.id} genreName={genreState.name} kind={genreState.type}
                onOpen={openDetail} inList={listIds} onToggleList={toggleList}
                onBack={backToBrowse}
              />
            ) : (
              <div onClick={backToBrowse} style={{ cursor: "pointer" }}>Genre not found. Go back.</div>
            )
          } />
          
          <Route path="/" element={
            view.item && view.page === "detail" ? (
              <DetailPage
                item={view.item} onBack={backToBrowse}
                inList={listIds} onToggleList={toggleList}
                onAskOwl={prompt => { setPendingPrompt(prompt); setChatOpen(true); }}
                onGenreClick={navigateToGenre}
              />
            ) : (
              <BrowsePage
                activeTab={activeTab} onOpen={openDetail}
                inList={listIds} onToggleList={toggleList}
                query={query} onOpenChat={() => setChatOpen(true)}
                onGenreClick={navigateToGenre}
              />
            )
          } />
        </Routes>
      </div>

      {/* ── Footer (hidden on detail page or auth page) ──────────────────────────────────── */}
      {view.page !== "detail" && location.pathname !== "/login" && location.pathname !== "/signup" && <Footer onGenreClick={navigateToGenre} />}

      {/* ── Chat widget ─────────────────────────────────────────────────────── */}
      <ChatWidget
        open={chatOpen} setOpen={setChatOpen}
        pendingPrompt={pendingPrompt} setPendingPrompt={setPendingPrompt}
        listData={listData}
      />
    </div>
  );
}
