"use client";

import { useEffect, useRef, useState } from "react";
import { DropdownSurface, isInsideDropdownSurface } from "./DropdownSurface";
import { MenuItem } from "./MenuItem";
import type { MenuItemTone } from "./MenuItem";

export interface RowAction {
  label: string;
  onSelect: () => void;
  /** "danger" renders the row red — use for destructive actions like Delete. */
  tone?: Extract<MenuItemTone, "default" | "danger">;
}

interface RowActionMenuProps {
  actions: RowAction[];
  /** Names the trigger for screen readers, e.g. "Contact actions". */
  label: string;
}

/**
 * Kebab (⋮) trigger that opens a small menu of per-row actions. Lives in the
 * leftmost column of list rows so edit/delete/etc. never sit loose in the table.
 * Stops click propagation so opening the menu or picking an action never also
 * triggers the row's own onClick.
 */
export function RowActionMenu({ actions, label }: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (isInsideDropdownSurface(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div style={{ display: "flex" }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={anchorRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 28,
          height: 28,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: open || hover ? "var(--bg-surface-hover)" : "transparent",
          color: open ? "var(--text-primary)" : "var(--text-tertiary)",
          border: "1px solid transparent",
          borderRadius: "var(--radius-s)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          transition: "background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
        }}
      >
        ⋮
      </button>
      <DropdownSurface open={open} anchorRef={anchorRef} maxHeight={280} minWidth={180}>
        <div role="menu">
          {actions.map((a) => (
            <MenuItem
              key={a.label}
              tone={a.tone ?? "default"}
              onClick={() => {
                setOpen(false);
                a.onSelect();
              }}
            >
              {a.label}
            </MenuItem>
          ))}
        </div>
      </DropdownSurface>
    </div>
  );
}
