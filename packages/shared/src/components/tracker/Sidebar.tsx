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
  { href: "/interview-prep", label: "Interview Prep", icon: "◈" },
  { href: "/followups", label: "Follow-Ups", icon: "↻" },
  { href: "/tasks", label: "Tasks", icon: "☑" },
  { href: "/contacts", label: "Contacts", icon: "◎" },
  { href: "/networking", label: "Networking", icon: "⇄" },
];

interface SidebarProps {
  userName: string;
}

export function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const trimmedName = userName.trim();

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
        Job Tracker
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
          paddingTop: 12,
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            padding: "8px 8px 0",
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
              flexShrink: 0,
            }}
          >
            {trimmedName ? trimmedName[0].toUpperCase() : "?"}
          </div>
          <span
            style={{
              font: "var(--text-body-s)",
              color: trimmedName ? "var(--text-secondary)" : "var(--text-tertiary)",
              fontStyle: trimmedName ? "normal" : "italic",
            }}
          >
            {trimmedName || "Add your name"}
          </span>
        </div>
        <Link
          href="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 2,
            padding: "9px 10px",
            border: "none",
            borderRadius: "var(--radius-s)",
            textAlign: "left",
            background: isActive("/settings") ? "var(--blue-100)" : "transparent",
            color: isActive("/settings") ? "var(--blue-700)" : "var(--text-secondary)",
            font: "var(--text-body-m)",
            fontWeight: isActive("/settings") ? 700 : 400,
            textDecoration: "none",
          }}
        >
          <span style={{ width: 16, textAlign: "center" }}>⚙</span>
          Settings
        </Link>
      </div>
    </div>
  );
}
