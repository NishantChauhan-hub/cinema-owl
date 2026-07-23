import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MediaCard from "./MediaCard";
import SkeletonCard from "./SkeletonCard";

/**
 * A horizontally-scrollable row of MediaCards.
 *
 * Props:
 *  - title, icon (Icon), accent, emoji — header display
 *  - items        — array of media objects
 *  - loading      — show skeletons instead of cards
 *  - onOpen       — passed down to each MediaCard
 *  - inList       — Set of IDs in My List
 *  - onToggleList — passed down to each MediaCard
 *  - onSeeAll     — optional: shows a "See all" button that calls this
 */
export default function Rail({ title, icon: Icon, accent, emoji, items, loading, onOpen, inList, onToggleList, onSeeAll }) {
  const rowRef = useRef(null);

  function scroll(direction) {
    rowRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  }

  return (
    <div style={{ marginBottom: 32 }} className="fade-up">
      {/* Header row */}
      <div className="rail-header">
        <div className="rail-title">
          {Icon
            ? <Icon size={16} color={accent} />
            : <span style={{ fontSize: 16 }}>{emoji}</span>}
          {title}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, marginRight: 4, display: "flex", alignItems: "center", gap: 2, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--cyan)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
            >
              See all <ChevronRight size={12} />
            </button>
          )}
          <button className="nav-arrow" onClick={() => scroll(-1)}><ChevronLeft size={14} /></button>
          <button className="nav-arrow" onClick={() => scroll(1)}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Scrollable cards row */}
      <div ref={rowRef} className="no-sb rail-scroll">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.length === 0
            ? <div style={{ color: "var(--text-dim)", fontSize: 13, paddingTop: 12 }}>Nothing here yet.</div>
            : items.map(item => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onOpen={onOpen}
                  inList={inList.has(item.id)}
                  onToggleList={onToggleList}
                />
              ))
        }
      </div>
    </div>
  );
}
