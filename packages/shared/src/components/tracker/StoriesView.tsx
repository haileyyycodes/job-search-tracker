"use client";

import { useMemo, useState } from "react";
import { Button, Input, ListRow, Pagination, RowActionMenu, TextLink } from "@/components/ds";
import { ListCount } from "./ListCount";
import { StoryDialog } from "./StoryDialog";
import { ConfirmDeleteStoryDialog } from "./ConfirmDeleteStoryDialog";
import { richTextHtmlToPlainText } from "@/lib/richTextEditorHtml";
import type { NewStory } from "@/lib/dataSource/types";
import type { Story } from "@/lib/types";

interface StoriesViewProps {
  stories: Story[];
  onBack: () => void;
  onAddStory: (story: NewStory) => void;
  onEditStory: (story: Story) => void;
  onDeleteStory: (id: number) => void;
}

const GRID = "36px 1.5fr 1.5fr 1fr";
const PAGE_SIZE = 10;

function dateRangeLabel(story: Story): string | undefined {
  if (!story.date) return undefined;
  return story.toDate ? `${story.date} – ${story.toDate}` : story.date;
}

function TagChip({ label }: { label: string }) {
  return (
    <span
      style={{
        font: "var(--text-caption)",
        padding: "3px 8px",
        borderRadius: "var(--radius-pill)",
        background: "var(--bg-surface-sunken)",
        color: "var(--text-secondary)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function StoriesView({ stories, onBack, onAddStory, onEditStory, onDeleteStory }: StoriesViewProps) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Story | null>(null);
  const [deleting, setDeleting] = useState<Story | null>(null);

  // Any filter change can shrink the result set, so jump back to the first page.
  const resetPage = () => setPage(1);

  // Newest first — getStories() returns insertion (id) order.
  const ordered = useMemo(() => [...stories].reverse(), [stories]);
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? ordered.filter(
        (s) =>
          s.title.toLowerCase().includes(needle) ||
          richTextHtmlToPlainText(s.content).replace(/\s+/g, " ").toLowerCase().includes(needle) ||
          s.tags.some((tag) => tag.toLowerCase().includes(needle))
      )
    : ordered;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ padding: "20px 32px 18px", borderBottom: "1px solid var(--border-default)", background: "var(--bg-page)" }}>
        <TextLink onClick={onBack} style={{ font: "700 13px var(--font-body)", display: "inline-block", marginBottom: 8 }}>
          ← Story Bank
        </TextLink>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div>
            <h1 style={{ margin: 0, font: "800 30px var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Achievements
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
              Reusable write-ups to pull into a tailored résumé or reference during behavioral prep.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>+ Add achievement</Button>
        </div>
      </div>

      <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
        <div style={{ display: "flex", gap: 12, padding: "16px 0", flexWrap: "wrap" }}>
          <div style={{ width: 260 }}>
            <Input
              placeholder="Search title, text, or tag…"
              value={q}
              onChange={(v) => {
                setQ(v);
                resetPage();
              }}
            />
          </div>
          <ListCount shown={filtered.length} total={stories.length} noun="achievement" />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
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
          <span />
          <span>Title</span>
          <span>Preview</span>
          <span>Tags</span>
        </div>

        {visible.map((story) => (
          <ListRow key={story.id} columns={GRID} align="start" onClick={() => setEditing(story)}>
            <RowActionMenu
              label="Achievement actions"
              actions={[{ label: "Delete achievement", tone: "danger", onSelect: () => setDeleting(story) }]}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ font: "700 14px var(--font-body)", color: "var(--text-primary)" }}>
                {story.title || "Untitled achievement"}
              </span>
              {dateRangeLabel(story) && (
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{dateRangeLabel(story)}</span>
              )}
            </div>
            <span
              style={{
                font: "var(--text-body-s)",
                color: "var(--text-tertiary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {richTextHtmlToPlainText(story.content).replace(/\s+/g, " ").trim() || "—"}
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {story.tags.length > 0 ? story.tags.map((tag) => <TagChip key={tag} label={tag} />) : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
            </div>
          </ListRow>
        ))}

        {stories.length === 0 ? (
          <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
            No achievements yet — add one to get started.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
            No achievements match.
          </div>
        ) : null}

        <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
      </div>

      {addOpen && <StoryDialog onClose={() => setAddOpen(false)} onSubmit={(fields) => onAddStory({ ...fields })} />}
      {editing && (
        <StoryDialog
          story={editing}
          onClose={() => setEditing(null)}
          onSubmit={(fields) => onEditStory({ ...editing, ...fields })}
        />
      )}
      {deleting && (
        <ConfirmDeleteStoryDialog
          story={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            onDeleteStory(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
