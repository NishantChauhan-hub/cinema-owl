import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Bookmark, BookmarkCheck, Users, User, Calendar, Wand2, Loader2 } from "lucide-react";
import { TMDB_IMG } from "../constants";
import { apiFetch, hashGrad, fmtMoney, fmtRuntime } from "../utils";
import RatingBadge from "../components/RatingBadge";

/**
 * Builds the stats table rows from a detail object.
 * Centralised here so the JSX below stays clean.
 */
function buildStats(d) {
  if (!d) return [];
  const rows = [];
  if (d.status)          rows.push({ label: "Status",     value: d.status });
  if (d.runtime)         rows.push({ label: "Runtime",    value: fmtRuntime(d.runtime) });
  if (d.releaseDate)     rows.push({ label: "Release",    value: new Date(d.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) });
  if (d.originalLanguage) rows.push({ label: "Language",  value: d.originalLanguage.toUpperCase() });
  if (d.voteCount)       rows.push({ label: "Votes",      value: Number(d.voteCount).toLocaleString() });
  if (d.budget > 0)      rows.push({ label: "Budget",     value: fmtMoney(d.budget) });
  if (d.revenue > 0)     rows.push({ label: "Revenue",    value: fmtMoney(d.revenue) });
  if (d.collection)      rows.push({ label: "Collection", value: d.collection });
  if (d.seasons)         rows.push({ label: "Seasons",    value: `${d.seasons} season${d.seasons > 1 ? "s" : ""}` });
  if (d.episodes)        rows.push({ label: "Episodes",   value: d.episodes });
  if (d.episodeRuntime)  rows.push({ label: "Ep. Length", value: fmtRuntime(d.episodeRuntime) });
  if (d.networks?.length) rows.push({ label: "Network",  value: d.networks.join(", ") });
  if (d.lastAirDate)     rows.push({ label: "Last Aired", value: d.lastAirDate });
  if (d.creators?.length) rows.push({ label: "Created by",value: d.creators.join(", ") });
  if (d.director)        rows.push({ label: "Director",   value: d.director });
  if (d.production)      rows.push({ label: "Studio",     value: d.production });
  // Anime-specific fields
  if (d.aired)           rows.push({ label: "Aired",      value: d.aired });
  if (d.source)          rows.push({ label: "Source",     value: d.source });
  if (d.rank)            rows.push({ label: "MAL Rank",   value: `#${d.rank}` });
  return rows;
}

/**
 * Full detail view for a movie, show, or anime.
 *
 * Props:
 *  - item          — basic media object (id, type, title, poster)
 *  - onBack        — go back to browse
 *  - inList        — Set of IDs in My List
 *  - onToggleList  — add/remove from list
 *  - onAskOwl(prompt) — opens chat with a pre-filled message
 *  - onGenreClick  — navigate to a genre page
 */
export default function DetailPage({ item, onBack, inList, onToggleList, onAskOwl, onGenreClick }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Extract the raw TMDB/MAL id from our composite id (e.g. "movie-123" → "123")
  useEffect(() => {
    setLoading(true);
    setDetail(null);
    const rawId = item.id.split("-").slice(1).join("-");
    apiFetch(`/titles/detail/${item.type}/${rawId}`).then(data => {
      setDetail(data || item);
      setLoading(false);
    });
  }, [item]);

  const d    = detail || item;
  const grad = useMemo(() => hashGrad(item.id), [item.id]);
  const stats = useMemo(() => buildStats(loading ? null : d), [d, loading]);

  const posterSrc = d.poster
    ? d.poster.startsWith("http") ? d.poster : `${TMDB_IMG}${d.poster}`
    : null;

  return (
    <div className="fade-up">
      <button className="back-btn" onClick={onBack}><ChevronLeft size={14} /> back to browse</button>

      <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,230px) 1fr", gap: 28, alignItems: "start" }}>

        {/* ── Left: poster + list button ─────────────────────────────────────── */}
        <div>
          <div className="detail-poster">
            {loading ? (
              <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
            ) : posterSrc ? (
              <img src={posterSrc} alt={d.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontSize: 16, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 20 }}>
                {d.title}
              </div>
            )}
          </div>
          <button className="btn-outline" style={{ marginTop: 10 }} onClick={() => onToggleList(item)}>
            {inList.has(item.id)
              ? <><BookmarkCheck size={14} color="#00D4FF" /> in my list</>
              : <><Bookmark size={14} /> add to my list</>}
          </button>
        </div>

        {/* ── Right: metadata ────────────────────────────────────────────────── */}
        <div>
          {loading ? (
            /* Skeleton placeholders while fetching */
            <>
              <div className="skeleton" style={{ height: 14, width: "35%", marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 34, width: "70%", marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 80, marginBottom: 20 }} />
            </>
          ) : (
            <>
              {/* Type badge + genre pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {d.type || item.type}
                </span>
                {d.genreIds?.map(g => (
                  <button key={g.id} className="genre-pill"
                    onClick={() => onGenreClick(g.id, g.name, item.type === "anime" ? "movie" : item.type)}>
                    {g.name}
                  </button>
                ))}
              </div>

              <h1 style={{ fontFamily: "var(--font-head)", fontSize: "clamp(20px,4vw,30px)", fontWeight: 700, color: "var(--text)", lineHeight: 1.15, marginBottom: 6 }}>
                {d.title}
              </h1>

              {d.tagline && (
                <p style={{ fontStyle: "italic", color: "var(--text-dim)", fontSize: 13, marginBottom: 10 }}>
                  "{d.tagline}"
                </p>
              )}

              {/* Rating row */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <RatingBadge rating={d.rating} />
                {d.voteCount > 0 && (
                  <span style={{ color: "var(--text-dim)", fontSize: 12 }}>({Number(d.voteCount).toLocaleString()} votes)</span>
                )}
                <span style={{ color: "var(--text-dim)" }}>·</span>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{d.year || "TBA"}</span>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                {d.blurb || d.overview || item.blurb || "No description available."}
              </p>

              {/* Next episode banner (shows only) */}
              {d.nextEpisode && (
                <div style={{ background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 18, display: "flex", gap: 10, alignItems: "center" }}>
                  <Calendar size={15} color="var(--cyan)" />
                  <div>
                    <div style={{ fontSize: 11, color: "var(--cyan)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Next Episode</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      S{d.nextEpisode.season}E{d.nextEpisode.episode} · {d.nextEpisode.name} · {d.nextEpisode.date}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats table */}
              {stats.length > 0 && (
                <div className="info-panel" style={{ marginBottom: 18 }}>
                  {stats.map(s => (
                    <div key={s.label} className="stat-row">
                      <span className="stat-label">{s.label}</span>
                      <span className="stat-value">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cast grid */}
              {d.cast?.length > 0 && (
                <div className="info-panel" style={{ marginBottom: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
                    <Users size={14} color="var(--cyan)" /> Cast
                  </div>
                  <div className="cast-grid">
                    {d.cast.slice(0, 10).map(c => (
                      <div key={c.name} className="cast-card">
                        {c.profile
                          ? <img src={c.profile} alt={c.name} className="cast-avatar" onError={e => { e.target.style.display = "none"; }} />
                          : <div className="cast-avatar-placeholder"><User size={18} color="var(--text-dim)" /></div>}
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", lineHeight: 1.3 }}>{c.name}</div>
                        {c.character && <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{c.character}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn-primary" onClick={() => onAskOwl(`Tell me about ${d.title}`)}>
                <Wand2 size={14} /> Ask Owl about this
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
