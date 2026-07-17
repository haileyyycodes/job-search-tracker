"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  href: string;
  label: string;
  icon: string;
}

const items: SidebarItem[] = [
  { href: "/", label: "Dashboard", icon: "⌂" },
  { href: "/applications", label: "Applications", icon: "☰" },
  { href: "/companies", label: "Companies", icon: "▣" },
  { href: "/interviews", label: "Interviews", icon: "◔" },
  { href: "/followups", label: "Follow-Ups", icon: "↻" },
  { href: "/tasks", label: "Tasks", icon: "☑" },
  { href: "/feedback", label: "Feedback", icon: "✉" },
  { href: "/contacts", label: "Contacts", icon: "◎" },
  { href: "/networking", label: "Networking", icon: "⇄" },
];

interface SidebarProps {
  onRequestReset: () => void;
  onRequestClearAll: () => void;
}

export function Sidebar({ onRequestReset, onRequestClearAll }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

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
        <Link
          key={it.href}
          href={it.href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 10px",
            border: "none",
            borderRadius: "var(--radius-s)",
            textAlign: "left",
            background: isActive(it.href) ? "var(--blue-100)" : "transparent",
            color: isActive(it.href) ? "var(--blue-700)" : "var(--text-secondary)",
            font: "var(--text-body-m)",
            fontWeight: isActive(it.href) ? 700 : 400,
            textDecoration: "none",
          }}
        >
          <span style={{ width: 16, textAlign: "center" }}>{it.icon}</span>
          {it.label}
        </Link>
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
      <button
        onClick={onRequestClearAll}
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
        Clear all data
      </button>
    </div>
  );
}
