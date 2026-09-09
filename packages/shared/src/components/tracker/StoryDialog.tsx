"use client";

import { useState } from "react";
import { Dialog, Button, Input, FieldLabel } from "@/components/ds";
import type { Story } from "@/lib/types";

interface StoryFields {
  title: string;
  content: string;
  tags: string[];
}

interface StoryDialogProps {
  /** Omit to open in "create" mode; pass a story to edit it. */
  story?: Story;
  onClose: () => void;
  onSubmit: (fields: StoryFields) => void;
}

function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Fresh state each open — the parent only mounts this while the flow is active. */
export function StoryDialog({ story, onClose, onSubmit }: StoryDialogProps) {
  const [title, setTitle] = useState(story?.title ?? "");
  const [tags, setTags] = useState((story?.tags ?? []).join(", "));
  const [content, setContent] = useState(story?.content ?? "");
  const [submitted, setSubmitted] = useState(false);

  const handleSave = () => {
    setSubmitted(true);
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), content: content.trim(), tags: parseTags(tags) });
    onClose();
  };

  return (
    <Dialog
      open
      title={story ? "Edit story" : "Add story"}
      onClose={onClose}
      fullScreen
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Input
          label="Title"
          required
          placeholder="e.g. Rebuilt the checkout flow, cut drop-off 22%"
          value={title}
          onChange={setTitle}
          error={submitted && !title.trim() ? "Required" : undefined}
        />
        <Input
          label="Tags"
          placeholder="Comma-separated, e.g. resume, conflict, leadership"
          value={tags}
          onChange={setTags}
          hint="Used to group and filter stories."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 0 }}>
          <FieldLabel>Story</FieldLabel>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="The situation, what you did, and how it landed. Keep it reusable."
            style={{
              width: "100%",
              minHeight: 240,
              flex: 1,
              resize: "none",
              padding: "12px 14px",
              border: "1px solid var(--border-default)",
              borderRadius: 12,
              background: "var(--bg-surface-sunken)",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}
