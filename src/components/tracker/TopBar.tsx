import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function TopBar({ title, subtitle, children }: TopBarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding: "24px 32px 16px",
        borderBottom: "1px solid var(--border-default)",
        background: "var(--bg-page)",
      }}
    >
      <div>
        <h1 style={{ font: "var(--text-display-m)", color: "var(--text-primary)", margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>{children}</div>
    </div>
  );
}
