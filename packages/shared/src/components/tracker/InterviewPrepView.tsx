"use client";

import { Card } from "@/components/ds";
import { INTERVIEW_PREP_CATEGORIES } from "@/lib/interviewPrep";
import { isRichTextEmpty } from "@/lib/richTextEditorHtml";
import type { InterviewPrepQuestion } from "@/lib/types";

interface InterviewPrepViewProps {
  questions: InterviewPrepQuestion[];
  storyCount: number;
  onSelectCategory: (slug: string) => void;
  onSelectStories: () => void;
}

export function InterviewPrepView({
  questions,
  storyCount,
  onSelectCategory,
  onSelectStories,
}: InterviewPrepViewProps) {
  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        {INTERVIEW_PREP_CATEGORIES.map((cat) => {
          const count = questions.filter((q) => q.category === cat.slug).length;
          const answered = questions.filter((q) => q.category === cat.slug && !isRichTextEmpty(q.answer)).length;
          return (
            <Card key={cat.slug} padding="lg" hover onClick={() => onSelectCategory(cat.slug)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 style={{ font: "var(--text-heading-m)", color: "var(--text-primary)", margin: 0 }}>{cat.label}</h2>
                <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", margin: 0 }}>{cat.description}</p>
                <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 8 }}>
                  {count === 0
                    ? "No questions yet"
                    : `${count} question${count === 1 ? "" : "s"} · ${answered} answered`}
                </div>
              </div>
            </Card>
          );
        })}
        <Card padding="lg" hover onClick={onSelectStories}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ font: "var(--text-heading-m)", color: "var(--text-primary)", margin: 0 }}>Achievements</h2>
            <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", margin: 0 }}>
              Reusable write-ups for résumé tailoring and behavioral prep.
            </p>
            <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 8 }}>
              {storyCount === 0 ? "No achievements yet" : `${storyCount} achievement${storyCount === 1 ? "" : "s"}`}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
