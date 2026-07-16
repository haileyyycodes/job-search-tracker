import type { TrackerView } from "@/lib/types";

interface SidebarItem {
  key: TrackerView;
  label: string;
  icon: string;
}

const items: SidebarItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "⌂" },
  { key: "applications", label: "Applications", icon: "☰" },
  { key: "interviews", label: "Interviews", icon: "◔" },
  { key: "followups", label: "Follow-Ups", icon: "↻" },
  { key: "tasks", label: "Tasks", icon: "☑" },
  { key: "contacts", label: "Contacts", icon: "◎" },
  { key: "networking", label: "Networking", icon: "⇄" },
];

interface SidebarProps {
  view: TrackerView;
  setView: (view: TrackerView) => void;
  onRequestReset: () => void;
}

export function Sidebar({ view, setView, onRequestReset }: SidebarProps) {
  return (
    <div
      style={{
        width: 216,
        flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        gap: 2,
        height: "100%",
      }}
    >
      <div
        style={{
          font: "800 20px var(--font-display)",
          color: "var(--blue-600)",
          padding: "0 8px",
          marginBottom: 24,
          letterSpacing: "-0.02em",
        }}
      >
        Harbor
      </div>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setView(it.key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 10px",
            border: "none",
            borderRadius: "var(--radius-s)",
            textAlign: "left",
            background: view === it.key ? "var(--blue-100)" : "transparent",
            color: view === it.key ? "var(--blue-700)" : "var(--text-secondary)",
            font: "var(--text-body-m)",
            fontWeight: view === it.key ? 700 : 400,
            cursor: "pointer",
          }}
        >
          <span style={{ width: 16, textAlign: "center" }}>{it.icon}</span>
          {it.label}
        </button>
      ))}
      <div
        style={{
          marginTop: "auto",
          padding: "12px 8px",
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--green-500)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: "700 12px var(--font-display)",
          }}
        >
          J
        </div>
        <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>Jordan A.</span>
      </div>
      <button
        onClick={onRequestReset}
        style={{
          background: "none",
          border: "none",
          textAlign: "left",
          padding: "6px 8px",
          font: "var(--text-caption)",
          color: "var(--text-tertiary)",
          cursor: "pointer",
        }}
      >
        Reset demo data
      </button>
    </div>
  );
}
