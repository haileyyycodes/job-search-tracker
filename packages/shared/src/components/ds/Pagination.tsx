"use client";

import { useState } from "react";

interface PaginationProps {
  /** 1-indexed current page. */
  page: number;
  /** Total number of pages. Values < 1 are treated as 1. */
  pageCount: number;
  onPageChange: (page: number) => void;
}

/** Prev / "Page 2 of 7" / Next control for chunked lists. Always rendered; on a single page both arrows are disabled. */
export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const pages = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), pages);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 12,
        padding: "16px 4px",
      }}
    >
      <PageButton disabled={current <= 1} onClick={() => onPageChange(current - 1)}>
        ‹ Prev
      </PageButton>
      <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
        Page {current} of {pages}
      </span>
      <PageButton disabled={current >= pages} onClick={() => onPageChange(current + 1)}>
        Next ›
      </PageButton>
    </div>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 32,
        padding: "0 12px",
        background: disabled ? "transparent" : hover ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        color: disabled ? "var(--ink-400)" : "var(--text-primary)",
        border: `1px solid ${disabled ? "var(--border-default)" : "var(--border-strong)"}`,
        borderRadius: "var(--radius-s)",
        font: "var(--text-body-s)",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background var(--duration-fast) var(--ease-standard)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
