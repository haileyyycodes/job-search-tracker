"use client";

import { Card } from "@/components/ds";
import { INTERVIEW_PREP_CATEGORIES } from "@/lib/interviewPrep";
import type { InterviewPrepQuestion } from "@/lib/types";

interface InterviewPrepViewProps {
  questions: InterviewPrepQuestion[];
  onSelectCategory: (slug: string) => void;
}

export function InterviewPrepView({ questions, onSelectCategory }: InterviewPrepViewProps) {
  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
          paddingTop: 20,
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
    </div>
  );
}
