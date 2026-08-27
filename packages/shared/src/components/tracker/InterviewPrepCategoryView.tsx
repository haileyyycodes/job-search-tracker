"use client";

import { useState } from "react";
import { Button, IconButton, Input } from "@/components/ds";
import { interviewPrepCategory } from "@/lib/interviewPrep";
import type { NewInterviewPrepQuestion } from "@/lib/dataSource/types";
import type { InterviewPrepQuestion } from "@/lib/types";

interface InterviewPrepCategoryViewProps {
  categorySlug: string;
  questions: InterviewPrepQuestion[];
  onBack: () => void;
  onAddQuestion: (question: NewInterviewPrepQuestion) => void;
  onEditQuestion: (question: InterviewPrepQuestion) => void;
  onDeleteQuestion: (id: number) => void;
}

/** Preserves first-seen order of section labels; questions with no section group together (key undefined). */
function groupBySection(questions: InterviewPrepQuestion[]): Array<[string | undefined, InterviewPrepQuestion[]]> {
  const order: (string | undefined)[] = [];
  const groups = new Map<string | undefined, InterviewPrepQuestion[]>();
  for (const q of questions) {
    if (!groups.has(q.section)) {
      groups.set(q.section, []);
      order.push(q.section);
    }
    groups.get(q.section)!.push(q);
  }
  return order.map((key) => [key, groups.get(key)!]);
}

interface QuestionRowProps {
  question: InterviewPrepQuestion;
  onEditAnswer: (answer: string) => void;
  onDelete: () => void;
}

/** Owns its own draft answer text so typing doesn't fight with the optimistic state update on every keystroke. */
function QuestionRow({ question, onEditAnswer, onDelete }: QuestionRowProps) {
  const [answer, setAnswer] = useState(question.answer);

  return (
    <div style={{ padding: "16px 4px", borderBottom: "1px solid var(--border-default)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ font: "700 14px var(--font-body)", color: "var(--text-primary)" }}>{question.question}</div>
        <IconButton aria-label="Delete question" icon={<span>✕</span>} size="sm" onClick={onDelete} />
      </div>
      <textarea
        placeholder="Fill in your own answer…"
        rows={3}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onBlur={() => {
          if (answer !== question.answer) onEditAnswer(answer);
        }}
        style={{
          width: "100%",
          marginTop: 10,
          padding: 10,
          border: "1.5px solid var(--border-default)",
          borderRadius: "var(--radius-s)",
          font: "var(--text-body-s)",
          color: "var(--text-primary)",
          resize: "vertical",
          background: "var(--bg-surface)",
        }}
      />
    </div>
  );
}

export function InterviewPrepCategoryView({
  categorySlug,
  questions,
  onBack,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: InterviewPrepCategoryViewProps) {
  const category = interviewPrepCategory(categorySlug);
  const [newQuestion, setNewQuestion] = useState("");
  const [newSection, setNewSection] = useState("");

  const handleAdd = () => {
    if (!newQuestion.trim()) return;
    onAddQuestion({
      category: categorySlug,
      section: newSection.trim() || undefined,
      question: newQuestion.trim(),
      answer: "",
    });
    setNewQuestion("");
    setNewSection("");
  };

  const groups = groupBySection(questions);

  return (
    <div style={{ padding: "20px 32px 40px", overflow: "auto", flex: 1 }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-link)",
          font: "700 13px var(--font-body)",
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back to interview prep
      </button>
      <h1 style={{ font: "var(--text-heading-l)", margin: 0, color: "var(--text-primary)" }}>
        {category?.label ?? categorySlug}
      </h1>
      {category?.description && (
        <p style={{ font: "var(--text-body-m)", color: "var(--text-secondary)", marginTop: 4 }}>{category.description}</p>
      )}

      <div style={{ marginTop: 24 }}>
        {groups.map(([section, groupQuestions]) => (
          <div key={section ?? "__ungrouped__"}>
            {section && (
              <h3
                style={{
                  font: "var(--text-label)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-wide)",
                  color: "var(--text-tertiary)",
                  margin: "20px 0 4px",
                }}
              >
                {section}
              </h3>
            )}
            {groupQuestions.map((q) => (
              <QuestionRow
                key={q.id}
                question={q}
                onEditAnswer={(answer) => onEditQuestion({ ...q, answer })}
                onDelete={() => onDeleteQuestion(q.id)}
              />
            ))}
          </div>
        ))}
        {questions.length === 0 && (
          <div style={{ padding: "16px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
            No questions yet — add your first one below.
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 2 }}>
          <Input label="New question" placeholder="e.g. Tell me about a time…" value={newQuestion} onChange={setNewQuestion} />
        </div>
        <div style={{ flex: 1 }}>
          <Input
            label="Section (optional)"
            placeholder="e.g. Conflict & Disagreement"
            value={newSection}
            onChange={setNewSection}
          />
        </div>
        <Button onClick={handleAdd} disabled={!newQuestion.trim()}>
          + Add question
        </Button>
      </div>
    </div>
  );
}
