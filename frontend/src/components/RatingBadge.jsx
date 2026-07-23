import React from "react";
import { Star } from "lucide-react";

/** Shows a star + score, or a "SOON" badge if no rating yet. */
export default function RatingBadge({ rating }) {
  if (!rating || rating === 0) {
    return <span className="soon-badge">SOON</span>;
  }
  return (
    <span className="rating-badge">
      <Star size={11} fill="#FFD700" strokeWidth={0} />
      {Number(rating).toFixed(1)}
    </span>
  );
}
