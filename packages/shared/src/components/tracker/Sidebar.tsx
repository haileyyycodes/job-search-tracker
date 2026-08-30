"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

interface SidebarItem {
  href: string;
  label: string;
  icon: string;
  beta?: boolean;
}

const items: SidebarItem[] = [
  { href: "/", label: "Dashboard", icon: "⌂" },
  { href: "/applications", label: "Applications", icon: "☰" },
  { href: "/companies", label: "Companies", icon: "▣" },
  { href: "/contacts", label: "Contacts", icon: "◎" },
  { href: "/networking", label: "Networking", icon: "⇄" },
  { href: "/interview-prep", label: "Interview Prep", icon: "◈", beta: true },
];

function BetaBadge() {
  return (
    <span
      style={{
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        height: 16,
        padding: "0 6px",
        borderRadius: "var(--radius-pill)",
        background: "var(--status-interview-bg)",
        color: "var(--status-interview-fg)",
        font: "var(--text-caption)",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      beta
    </span>
  );
}

interface SidebarProps {
  userName: string;
}

function SidebarLink({
  href,
  active,
  icon,
  label,
  beta,
}: {
  href: string;
  active: boolean;
  icon: string;
  label: ReactNode;
  beta?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const background = active
    ? pressed
      ? "var(--blue-300)"
      : hover
        ? "var(--blue-200)"
        : "var(--blue-100)"
    : pressed
      ? "var(--ink-200)"
      : hover
        ? "var(--bg-surface-hover)"
        : "transparent";

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        border: "none",
        borderRadius: "var(--radius-s)",
        textAlign: "left",
        background,
        color: active ? "var(--blue-700)" : hover ? "var(--text-primary)" : "var(--text-secondary)",
        font: "var(--text-body-m)",
        fontWeight: active ? 700 : 400,
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
      }}
    >
      <span style={{ width: 16, textAlign: "center" }}>{icon}</span>
      {label}
      {beta ? <BetaBadge /> : null}
    </Link>
  );
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
        <SidebarLink
          key={it.href}
          href={it.href}
          active={isActive(it.href)}
          icon={it.icon}
          label={it.label}
          beta={it.beta}
        />
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
        <div style={{ marginTop: 2 }}>
          <SidebarLink href="/settings" active={isActive("/settings")} icon="⚙" label="Settings" />
        </div>
      </div>
    </div>
  );
}
