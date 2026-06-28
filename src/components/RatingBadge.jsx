import React from "react";

export default function RatingBadge({ rating, className = "" }) {
  if (!rating) return null;
  return (
    <span
      className={`rating-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 6px",
        borderRadius: "4px",
        background: "rgba(255, 255, 255, 0.15)",
        color: "#fff",
        fontSize: "12px",
        fontWeight: "600",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      {rating}
    </span>
  );
}
