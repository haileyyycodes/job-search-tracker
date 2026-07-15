"use client";

import { useState } from "react";
import { Input, Select, Button } from "@/components/ds";
import type { Application, Task, TaskStatus } from "@/lib/types";

interface TasksViewProps {
  apps: Application[];
  tasks: Task[];
  onDismissTask: (id: string) => void;
}

type StatusFilter = TaskStatus | "all";

export function TasksView({ apps, tasks, onDismissTask }: TasksViewProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");

  const withApp = tasks.map((t) => ({ ...t, app: apps.find((a) => a.id === t.applicationId) }));
  const filtered = withApp.filter(
    (t) =>
      (status === "all" || t.status === status) &&
      t.app &&
      (t.app.company.toLowerCase().includes(q.toLowerCase()) || t.note.toLowerCase().includes(q.toLowerCase()))
  );
  filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search company or note…" value={q} onChange={setQ} />
        </div>
        <div style={{ width: 180 }}>
          <Select
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={[
              { value: "active", label: "Active" },
              { value: "dismissed", label: "Dismissed" },
              { value: "all", label: "All" },
            ]}
          />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 130px 1.4fr 100px 90px",
          padding: "12px 4px",
          font: "var(--text-label)",
          color: "var(--text-tertiary)",
          borderBottom: "1px solid var(--border-default)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wide)",
          fontSize: 11,
        }}
      >
        <span>Application</span>
        <span>Due</span>
        <span>Task</span>
        <span>Status</span>
        <span />
      </div>
      {filtered.map((t) => (
        <div
          key={t.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 130px 1.4fr 100px 90px",
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{t.app ? t.app.role : "—"}</div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{t.app ? t.app.company : ""}</div>
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{t.dueDate}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{t.note}</span>
          <span
            style={{
              font: "var(--text-caption)",
              fontWeight: 700,
              color: t.status === "active" ? "var(--blue-600)" : "var(--text-tertiary)",
            }}
          >
            {t.status === "active" ? "Active" : "Dismissed"}
          </span>
          {t.status === "active" ? (
            <Button size="sm" variant="secondary" onClick={() => onDismissTask(t.id)}>
              Dismiss
            </Button>
          ) : null}
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No tasks match.</div>
      )}
    </div>
  );
}
