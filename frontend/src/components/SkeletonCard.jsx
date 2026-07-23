import React from "react";

/** Animated shimmer placeholder shown while a card's data is loading. */
export default function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: 158 }}>
      <div className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 14 }} />
      <div className="skeleton" style={{ height: 13, marginTop: 8, borderRadius: 8, width: "60%" }} />
    </div>
  );
}
