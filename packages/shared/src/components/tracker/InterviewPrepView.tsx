"use client";

import { Card } from "@/components/ds";
import { INTERVIEW_PREP_CATEGORIES } from "@/lib/interviewPrep";
import type { InterviewPrepQuestion } from "@/lib/types";

interface InterviewPrepViewProps {
  questions: InterviewPrepQuestion[];
  pitchVersionCount: number;
  storyCount: number;
  onSelectCategory: (slug: string) => void;
  onSelectPitchBuilder: () => void;
  onSelectStories: () => void;
}

export function InterviewPrepView({
  questions,
  pitchVersionCount,
  storyCount,
  onSelectCategory,
  onSelectPitchBuilder,
  onSelectStories,
}: InterviewPrepViewProps) {
  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <p
        style={{
          font: "var(--text-label)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wide)",
          color: "var(--text-tertiary)",
          margin: "20px 0 12px",
        }}
      >
        Question banks
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {INTERVIEW_PREP_CATEGORIES.map((cat) => {
          const count = questions.filter((q) => q.category === cat.slug).length;
          const answered = questions.filter((q) => q.category === cat.slug && q.answer.trim() !== "").length;
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
      </div>

      <p
        style={{
          font: "var(--text-label)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wide)",
          color: "var(--text-tertiary)",
          margin: "28px 0 12px",
        }}
      >
        Tools
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        <Card padding="lg" hover onClick={onSelectStories}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ font: "var(--text-heading-m)", color: "var(--text-primary)", margin: 0 }}>Stories</h2>
            <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", margin: 0 }}>
              Reusable write-ups for résumé tailoring and behavioral prep.
            </p>
            <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 8 }}>
              {storyCount === 0 ? "No stories yet" : `${storyCount} stor${storyCount === 1 ? "y" : "ies"}`}
            </div>
          </div>
        </Card>
        <Card padding="lg" hover onClick={onSelectPitchBuilder}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ font: "var(--text-heading-m)", color: "var(--text-primary)", margin: 0 }}>Elevator pitch</h2>
            <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", margin: 0 }}>
              Build a short introduction, tailored per audience.
            </p>
            <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 8 }}>
              {pitchVersionCount === 0
                ? "No versions yet"
                : `${pitchVersionCount} version${pitchVersionCount === 1 ? "" : "s"}`}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
