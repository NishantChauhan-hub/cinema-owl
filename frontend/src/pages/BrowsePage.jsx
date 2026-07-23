import React, { useState, useEffect } from "react";
import { Search, Loader2, Bot, Cpu } from "lucide-react";
import { RAILS, GENRE_RAILS } from "../constants";
import { apiFetch } from "../utils";
import Rail from "../components/Rail";
import MediaCard from "../components/MediaCard";

/**
 * Main browse page. Shows:
 *  1. A hero banner
 *  2. Primary rails (Trending, Fresh Drops, Coming Soon)
 *  3. Genre rails (Action, Horror, etc.) — loaded staggered to avoid rate limits
 *  4. Search results overlay (when query is active)
 */
export default function BrowsePage({ activeTab, onOpen, inList, onToggleList, query, onOpenChat, onGenreClick }) {
  const [rails, setRails]             = useState({ trending: [], latest: [], upcoming: [] });
  const [loadingRails, setLoadingRails] = useState({ trending: true, latest: true, upcoming: true });
  const [genreRails, setGenreRails]   = useState({});
  const [loadingGenre, setLoadingGenre] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reload everything when the active tab changes (Movies / Shows / Anime)
  useEffect(() => {
    setRails({ trending: [], latest: [], upcoming: [] });
    setLoadingRails({ trending: true, latest: true, upcoming: true });
    setGenreRails({});

    // Primary rails
    RAILS.forEach(async (rail) => {
      const endpoint = activeTab === "anime"
        ? `/titles/anime/${rail.id}`
        : `/titles/${activeTab}/${rail.id}`;
      const data = await apiFetch(endpoint);
      setRails(prev => ({ ...prev, [rail.id]: data?.results || [] }));
      setLoadingRails(prev => ({ ...prev, [rail.id]: false }));
    });

    // Genre rails — staggered by 150ms each to avoid rate-limiting Jikan/TMDB
    const genres = GENRE_RAILS[activeTab] || [];
    if (genres.length) {
      const initLoading = Object.fromEntries(genres.map(g => [g.id, true]));
      setLoadingGenre(initLoading);

      genres.forEach(async (g, i) => {
        await new Promise(r => setTimeout(r, i * 150));
        const data = await apiFetch(`/titles/genre/${activeTab}/${g.id}`);
        setGenreRails(prev => ({ ...prev, [g.id]: data?.results?.slice(0, 16) || [] }));
        setLoadingGenre(prev => ({ ...prev, [g.id]: false }));
      });
    }
  }, [activeTab]);

  // Debounced search — waits 380ms after the user stops typing
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const data = await apiFetch(`/titles/search?q=${encodeURIComponent(query)}&kind=${activeTab}`);
      setSearchResults(data?.results || []);
      setSearchLoading(false);
    }, 380);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // ── Search results view ──────────────────────────────────────────────────────
  if (query.trim()) {
    return (
      <div className="fade-up">
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={14} color="var(--text-muted)" />
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Results for <strong style={{ color: "var(--text)" }}>"{query}"</strong>
          </span>
        </div>

        {searchLoading ? (
          <div className="content-loading">
            <Loader2 size={22} className="spin" color="var(--cyan)" />
            <span>Scanning…</span>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="empty-state">
            <Search size={28} style={{ marginBottom: 12 }} />
            <div>No results. Try a different search.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {searchResults.map(item => (
              <MediaCard key={item.id} item={item} onOpen={onOpen} inList={inList.has(item.id)} onToggleList={onToggleList} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Normal browse view ───────────────────────────────────────────────────────
  const genres = GENRE_RAILS[activeTab] || [];

  return (
    <div>
      {/* Hero banner */}
      <div className="hero fade-up">
        <div className="hero-grid" />
        <div className="hero-g1" /><div className="hero-g2" />
        <div className="hero-content">
          <div className="hero-chip"><Cpu size={10} /> AI-POWERED DISCOVERY</div>
          <h1 className="hero-title">Your next obsession,<br /><span>decoded by AI</span></h1>
          <p className="hero-sub">Live TMDB data · Gemini AI recommendations · Season news for your watchlist</p>
          <button className="hero-cta" onClick={onOpenChat}><Bot size={14} /> Talk to Owl AI</button>
        </div>
      </div>

      {/* Primary rails */}
      {RAILS.map(r => (
        <Rail
          key={r.id}
          title={r.label} icon={r.icon} accent={r.accent}
          items={rails[r.id]} loading={loadingRails[r.id]}
          onOpen={onOpen} inList={inList} onToggleList={onToggleList}
        />
      ))}

      {/* Genre rails */}
      {genres.length > 0 && (
        <>
          <div className="section-divider">
            <div className="section-divider-line" />
            <div className="section-divider-label">Browse by Genre</div>
            <div className="section-divider-line" />
          </div>
          {genres.map(g => (
            <Rail
              key={g.id}
              title={g.name} emoji={g.emoji} accent={g.accent}
              items={genreRails[g.id] || []} loading={!!loadingGenre[g.id]}
              onOpen={onOpen} inList={inList} onToggleList={onToggleList}
              onSeeAll={() => onGenreClick(g.id, g.name, activeTab)}
            />
          ))}
        </>
      )}
    </div>
  );
}
