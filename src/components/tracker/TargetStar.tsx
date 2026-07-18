"use client";

import type { MouseEvent } from "react";

interface TargetStarProps {
  isTarget: boolean;
  /** When provided, renders as a toggle button; otherwise a static badge. */
  onToggle?: () => void;
  size?: number;
}

/** The one target-company symbol used app-wide: a filled gold star. */
export function TargetStar({ isTarget, onToggle, size = 16 }: TargetStarProps) {
  const glyph = isTarget ? "★" : "☆";
  const color = isTarget ? "var(--yellow-500)" : "var(--ink-300)";

  if (!onToggle) {
    return (
      <span aria-label="Target company" title="Target company" style={{ fontSize: size, lineHeight: 1, color }}>
        {glyph}
      </span>
    );
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <button
      type="button"
      aria-label={isTarget ? "Remove from targets" : "Add to targets"}
      aria-pressed={isTarget}
      title={isTarget ? "Remove from targets" : "Add to targets"}
      onClick={handleClick}
      style={{
        background: "none",
        border: "none",
        padding: 4,
        cursor: "pointer",
        fontSize: size,
        lineHeight: 1,
        color,
        flexShrink: 0,
      }}
    >
      {glyph}
    </button>
  );
}
