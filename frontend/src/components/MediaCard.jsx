import React, { useState, useMemo } from "react";
import { Bookmark, BookmarkCheck, Play } from "lucide-react";
import { TMDB_IMG } from "../constants";
import { hashGrad } from "../utils";
import RatingBadge from "./RatingBadge";

/**
 * A single movie/show/anime card used in rails and grids.
 *
 * Props:
 *  - item        — the media object (id, title, poster, rating, year, type)
 *  - onOpen      — called with item when the card is clicked
 *  - inList      — boolean: is this item already in My List?
 *  - onToggleList — called with item when the bookmark button is clicked
 */
export default function MediaCard({ item, onOpen, inList, onToggleList }) {
  const [imgErr, setImgErr] = useState(false);
  const grad = useMemo(() => hashGrad(item.id || item.title), [item.id, item.title]);

  const posterSrc =
    item.poster && !imgErr
      ? item.poster.startsWith("http")
        ? item.poster
        : `${TMDB_IMG}${item.poster}`
      : null;

  return (
    <div className="media-card" onClick={() => onOpen(item)}>
      <div className="poster-wrap">
        {/* Poster image or gradient fallback */}
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={item.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="poster-grad" style={{ background: grad }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12, color: "#fff", lineHeight: 1.2 }}>
              {item.title}
            </div>
          </div>
        )}

        <div className="poster-overlay" />
        <div className="poster-year">{item.year || "TBA"}</div>

        {/* Play icon shown on hover */}
        <div className="card-hover-overlay">
          <div className="play-circle">
            <Play size={18} fill="#030308" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Bookmark toggle */}
        <button
          className={`card-add-btn ${inList ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleList(item); }}
          title={inList ? "Remove from My List" : "Add to My List"}
        >
          {inList
            ? <BookmarkCheck size={13} color="#00D4FF" />
            : <Bookmark size={13} color="rgba(232,232,255,0.6)" />}
        </button>
      </div>

      <div className="card-meta">
        <RatingBadge rating={item.rating} />
        <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "capitalize", marginLeft: "auto" }}>
          {item.type}
        </span>
      </div>
    </div>
  );
}
