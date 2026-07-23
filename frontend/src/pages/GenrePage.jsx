import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { apiFetch } from "../utils";
import MediaCard from "../components/MediaCard";

/**
 * Full-page grid for a single genre (e.g. "Action Movies").
 * Supports pagination with a "Load More" button.
 *
 * Props:
 *  - genreId, genreName, kind — identify what to fetch
 *  - onBack     — go back to browse
 *  - onOpen, inList, onToggleList — passed to MediaCard
 */
export default function GenrePage({ genreId, genreName, kind, onOpen, inList, onToggleList, onBack }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset and load page 1 whenever the genre changes
  useEffect(() => { load(1, true); }, [genreId, kind]);

  async function load(p, reset = false) {
    reset ? setLoading(true) : setLoadingMore(true);

    const data = await apiFetch(`/titles/genre/${kind}/${genreId}?page=${p}`);
    if (data?.results) {
      setItems(prev => reset ? data.results : [...prev, ...data.results]);
      setTotalPages(data.total_pages || 1);
      setPage(p);
    }

    setLoading(false);
    setLoadingMore(false);
  }

  return (
    <div className="fade-up">
      <button className="back-btn" onClick={onBack}><ChevronLeft size={14} /> Back</button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 26, color: "var(--text)" }}>
          {genreName}
        </h2>
        <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "capitalize" }}>
          {kind}s
        </span>
      </div>

      {loading ? (
        <div className="content-loading">
          <Loader2 size={22} className="spin" color="var(--cyan)" />
          <span>Loading…</span>
        </div>
      ) : (
        <>
          <div className="genre-grid">
            {items.map(item => (
              <MediaCard
                key={item.id} item={item} onOpen={onOpen}
                inList={inList.has(item.id)} onToggleList={onToggleList}
              />
            ))}
          </div>

          {page < totalPages && (
            <button className="load-more-btn" onClick={() => load(page + 1)} disabled={loadingMore}>
              {loadingMore
                ? <><Loader2 size={14} className="spin" /> Loading…</>
                : <><ChevronRight size={14} /> Load More</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}
