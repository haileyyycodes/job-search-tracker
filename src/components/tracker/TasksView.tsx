"use client";

import { useState } from "react";
import { Input, Select, Button, IconButton } from "@/components/ds";
import { companyName } from "@/lib/companies";
import { ListCount } from "./ListCount";
import type { Application, Company, Task, TaskStatus } from "@/lib/types";

interface TasksViewProps {
  apps: Application[];
  companies: Company[];
  tasks: Task[];
  onDismissTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectApp: (app: Application) => void;
}

type StatusFilter = TaskStatus | "all";

export function TasksView({ apps, companies, tasks, onDismissTask, onDeleteTask, onSelectApp }: TasksViewProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");

  const withApp = tasks.map((t) => ({ ...t, app: apps.find((a) => a.id === t.applicationId) }));
  const filtered = withApp.filter(
    (t) =>
      (status === "all" || t.status === status) &&
      t.app &&
      (companyName(t.app.companyId, companies).toLowerCase().includes(q.toLowerCase()) ||
        t.note.toLowerCase().includes(q.toLowerCase()))
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
        <ListCount shown={filtered.length} total={tasks.length} noun="task" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 130px 1.4fr 100px 150px",
          columnGap: 16,
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
            gridTemplateColumns: "1fr 130px 1.4fr 100px 150px",
          columnGap: 16,
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "center",
          }}
        >
          <div onClick={() => t.app && onSelectApp(t.app)} style={{ cursor: t.app ? "pointer" : "default" }}>
            <div style={{ font: "700 13px var(--font-body)", color: t.app ? "var(--text-link)" : "var(--text-primary)" }}>
              {t.app ? t.app.role : "—"}
            </div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
              {t.app ? companyName(t.app.companyId, companies) : ""}
            </div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {t.status === "active" && (
              <Button size="sm" variant="secondary" onClick={() => onDismissTask(t.id)}>
                Dismiss
              </Button>
            )}
            <IconButton aria-label="Delete task" icon={<span>✕</span>} size="sm" onClick={() => onDeleteTask(t.id)} />
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No tasks match.</div>
      )}
    </div>
  );
}
