import React, { useState, useMemo } from "react";
import { Bookmark, BookmarkCheck, Tv, Clapperboard, X, Zap, AlertCircle, Loader2, Cpu } from "lucide-react";
import { TMDB_IMG } from "../constants";
import { apiFetch, hashGrad, SESSION_ID } from "../utils";

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_CLASS = { confirmed: "s-confirmed", rumored: "s-rumored", cancelled: "s-cancelled", ongoing: "s-ongoing" };
const HYPE_CLASS   = { high: "hype-h", medium: "hype-m" };

/**
 * A single card in the My List grid.
 * Displayed inside WatchedPage — kept here since it's only used on this page.
 */
function WatchedCard({ item, onOpen, onRemove }) {
  const grad = useMemo(() => hashGrad(item.title_id), [item.title_id]);

  const mediaItem = {
    id:     item.title_id,
    type:   item.title_type,
    title:  item.title_name,
    poster: item.poster_url,
  };

  const posterSrc = item.poster_url
    ? item.poster_url.startsWith("http") ? item.poster_url : `${TMDB_IMG}${item.poster_url}`
    : null;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ cursor: "pointer" }} onClick={() => onOpen(mediaItem)}>
        <div className="poster-wrap" style={{ marginBottom: 7 }}>
          {posterSrc ? (
            <img src={posterSrc} alt={item.title_name}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div className="poster-grad" style={{ background: grad, position: "absolute", inset: 0 }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12, color: "#fff" }}>
                {item.title_name}
              </div>
            </div>
          )}
          <div className="poster-overlay" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.3, marginBottom: 2 }}>{item.title_name}</div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "capitalize" }}>{item.title_type}</div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        title="Remove"
        style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "99px", background: "rgba(255,0,110,0.18)", border: "1px solid rgba(255,0,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <X size={10} color="var(--magenta)" />
      </button>
    </div>
  );
}

/**
 * "My List" page — shows saved movies, shows, and anime.
 * Includes the AI-powered "Check Season News" feature for series.
 *
 * Props:
 *  - listData     — array of saved items (from the backend)
 *  - onToggleList — add/remove from list
 *  - onOpen       — open detail page for an item
 */
export default function WatchedPage({ listData, onToggleList, onOpen }) {
  const [news, setNews]             = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError]   = useState(null);

  const shows  = listData.filter(i => i.title_type === "show"  || i.title_type === "anime");
  const movies = listData.filter(i => i.title_type === "movie");

  async function checkSeasonNews() {
    setNewsLoading(true);
    setNews(null);
    setNewsError(null);
    const data = await apiFetch(`/watched/${SESSION_ID}/season-news`);
    if (!data || data.error) {
      setNewsError(data?.error || data?.detail || "Could not fetch news. Is the backend running?");
    } else {
      setNews(data);
    }
    setNewsLoading(false);
  }

  return (
    <div className="fade-up">
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 4 }}>
            MY COLLECTION
          </div>
          <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 24, color: "var(--text)" }}>My List</h2>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 3 }}>
            {listData.length} title{listData.length !== 1 ? "s" : ""} · {shows.length} series · {movies.length} movies
          </div>
        </div>
        {shows.length > 0 && (
          <button className="btn-season" onClick={checkSeasonNews} disabled={newsLoading}>
            {newsLoading
              ? <><Loader2 size={13} className="spin" /> Scanning AI…</>
              : <><Zap size={13} /> Check Season News</>}
          </button>
        )}
      </div>

      {/* Empty state */}
      {listData.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={36} color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: "var(--font-head)", fontSize: 17, color: "var(--text-muted)", marginBottom: 8 }}>
            Your list is empty
          </div>
          <div style={{ fontSize: 13, maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>
            Browse movies, shows &amp; anime and hit the <BookmarkCheck size={11} style={{ verticalAlign: "middle" }} /> icon on any card to save it here.
          </div>
        </div>
      ) : (
        <>
          {/* Series section */}
          {shows.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, display: "flex", gap: 6, alignItems: "center" }}>
                <Tv size={12} /> Series &amp; Anime · {shows.length}
              </div>
              <div className="watched-grid">
                {shows.map(item => (
                  <WatchedCard
                    key={item.title_id}
                    item={item}
                    onOpen={onOpen}
                    onRemove={() => onToggleList({ id: item.title_id, type: item.title_type, title: item.title_name, poster: item.poster_url })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Movies section */}
          {movies.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, display: "flex", gap: 6, alignItems: "center" }}>
                <Clapperboard size={12} /> Movies · {movies.length}
              </div>
              <div className="watched-grid">
                {movies.map(item => (
                  <WatchedCard
                    key={item.title_id}
                    item={item}
                    onOpen={onOpen}
                    onRemove={() => onToggleList({ id: item.title_id, type: item.title_type, title: item.title_name, poster: item.poster_url })}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Error message */}
      {newsError && (
        <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(255,0,110,0.07)", border: "1px solid rgba(255,0,110,0.22)", borderRadius: "var(--r)", display: "flex", gap: 10, alignItems: "center", color: "var(--magenta)", fontSize: 13 }}>
          <AlertCircle size={14} /> {newsError}
        </div>
      )}

      {/* AI Season News panel */}
      {news && (
        <div className="season-panel fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div className="ai-badge"><Cpu size={9} /> AI SCAN</div>
            <Zap size={13} color="var(--cyan)" />
          </div>
          <h3 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 6 }}>
            Season News
          </h3>
          {news.summary && <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>{news.summary}</p>}
          {news.message && !news.results && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{news.message}</p>}

          {news.results?.map((r, i) => (
            <div key={i} className="season-item">
              <div className={`s-dot ${STATUS_CLASS[r.status] || "s-unknown"}`} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{r.title}</span>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "capitalize" }}>{r.type}</span>
                  {r.hype_level && (
                    <span className={`hype ${HYPE_CLASS[r.hype_level] || "hype-l"}`}>{r.hype_level} hype</span>
                  )}
                </div>
                {r.season_info && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cyan)", marginBottom: 4 }}>{r.season_info}</div>
                )}
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{r.news}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
