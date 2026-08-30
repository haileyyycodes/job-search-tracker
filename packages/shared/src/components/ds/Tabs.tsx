"use client";

import { ReactNode, useState } from "react";

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (tab: T) => void;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const color = active
    ? "var(--text-primary)"
    : pressed
      ? "var(--text-primary)"
      : hover
        ? "var(--text-secondary)"
        : "var(--text-tertiary)";
  const underline = active
    ? "var(--accent-primary)"
    : hover || pressed
      ? "var(--border-strong)"
      : "transparent";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "none",
        border: "none",
        borderBottom: `2px solid ${underline}`,
        padding: "12px 4px",
        marginRight: 20,
        font: "700 13px var(--font-body)",
        color,
        cursor: "pointer",
        transition: "color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
      }}
    >
      {children}
    </button>
  );
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-default)", padding: "0 32px" }}>
      {tabs.map((t) => (
        <Tab key={t.id} active={active === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </Tab>
      ))}
    </div>
  );
}
