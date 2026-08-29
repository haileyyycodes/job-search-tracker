"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ds";
import { AddInterviewPrepQuestionDialog } from "./AddInterviewPrepQuestionDialog";
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

type FilterKey = "All" | "Not started" | "Drafted" | "Starred";
const FILTERS: FilterKey[] = ["All", "Not started", "Drafted", "Starred"];

function isDone(q: InterviewPrepQuestion): boolean {
  return q.answer.trim().length > 0;
}

function matchesFilter(q: InterviewPrepQuestion, filter: FilterKey, query: string): boolean {
  const done = isDone(q);
  if (filter === "Not started" && done) return false;
  if (filter === "Drafted" && !done) return false;
  if (filter === "Starred" && !q.starred) return false;
  const t = query.trim().toLowerCase();
  if (t && !q.question.toLowerCase().includes(t)) return false;
  return true;
}

interface SectionGroup {
  anchor: string;
  section: string | undefined;
  questions: InterviewPrepQuestion[];
}

/** Preserves first-seen order of section labels; questions with no section group together (key undefined). Anchors
 * are assigned from this full, unfiltered grouping so they stay stable across search/filter changes. */
function groupBySection(questions: InterviewPrepQuestion[]): SectionGroup[] {
  const order: (string | undefined)[] = [];
  const groups = new Map<string | undefined, InterviewPrepQuestion[]>();
  for (const q of questions) {
    if (!groups.has(q.section)) {
      groups.set(q.section, []);
      order.push(q.section);
    }
    groups.get(q.section)!.push(q);
  }
  return order.map((section, i) => ({ anchor: `sec-${i}`, section, questions: groups.get(section)! }));
}

function speakingSeconds(words: number): number {
  return Math.max(1, Math.round((words / 130) * 60));
}

interface QuestionRowProps {
  question: InterviewPrepQuestion;
  open: boolean;
  onToggleOpen: () => void;
  onToggleStar: () => void;
  onEditAnswer: (answer: string) => void;
  onDelete: () => void;
}

/** Owns its own draft answer text so typing doesn't fight with the optimistic state update on every keystroke. */
function QuestionRow({ question, open, onToggleOpen, onToggleStar, onEditAnswer, onDelete }: QuestionRowProps) {
  const [answer, setAnswer] = useState(question.answer);
  const [hover, setHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const done = isDone(question);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <article
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${open ? "var(--blue-300)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-m)",
        boxShadow: open ? "var(--shadow-m)" : "none",
        overflow: "hidden",
      }}
    >
      <div
        onClick={onToggleOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "15px 18px",
          cursor: "pointer",
          background: hover ? "var(--bg-surface-hover)" : "transparent",
        }}
      >
        <span
          style={{
            marginTop: 5,
            width: 9,
            height: 9,
            borderRadius: "var(--radius-pill)",
            flex: "none",
            background: done ? "var(--green-600)" : "var(--ink-300)",
            boxShadow: `0 0 0 3px ${done ? "var(--green-100)" : "var(--ink-100)"}`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, color: "var(--text-primary)" }}>
            {question.question}
          </p>
          {!open && done && (
            <p
              style={{
                margin: "5px 0 0",
                fontSize: 13,
                color: "var(--text-tertiary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {question.answer}
            </p>
          )}
        </div>
        <span
          style={{
            font: "var(--text-mono-s)",
            fontSize: 10.5,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "3px 8px",
            borderRadius: "var(--radius-pill)",
            flex: "none",
            color: done ? "var(--green-700)" : "var(--text-tertiary)",
            background: done ? "var(--green-100)" : "var(--bg-surface-sunken)",
          }}
        >
          {done ? "Drafted" : "Not started"}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          title="Star this question"
          aria-label={question.starred ? "Unstar question" : "Star question"}
          style={{
            border: 0,
            background: "transparent",
            cursor: "pointer",
            fontSize: 15,
            lineHeight: 1,
            padding: 3,
            flex: "none",
            color: question.starred ? "var(--yellow-500)" : "var(--ink-300)",
          }}
        >
          ★
        </button>
        <span
          aria-hidden
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            flex: "none",
            marginTop: 3,
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 160ms ease-out",
          }}
        >
          ▾
        </span>
      </div>

      {open && (
        <div style={{ padding: "0 18px 18px 42px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            {["Situation", "Task", "Action", "Result"].map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 11.5,
                  padding: "4px 9px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--blue-100)",
                  color: "var(--blue-700)",
                  fontWeight: 600,
                }}
              >
                {chip}
              </span>
            ))}
            <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", padding: "4px 2px" }}>
              Keep it to about 90 seconds spoken.
            </span>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onBlur={() => {
              if (answer !== question.answer) onEditAnswer(answer);
            }}
            placeholder="Write your story — the situation, what you did, and how it landed."
            style={{
              width: "100%",
              minHeight: 132,
              resize: "vertical",
              padding: "12px 14px",
              border: "1px solid var(--border-default)",
              borderRadius: 12,
              background: "var(--bg-surface-sunken)",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--text-primary)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ font: "var(--text-mono-s)", fontSize: 11.5, color: "var(--text-tertiary)" }}>
              {words ? `${words} words · about ${speakingSeconds(words)}s spoken` : "Autosaves as you type"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onDelete}
                onMouseEnter={() => setRemoveHover(true)}
                onMouseLeave={() => setRemoveHover(false)}
                style={{
                  height: 32,
                  padding: "0 12px",
                  border: 0,
                  borderRadius: "var(--radius-s)",
                  background: removeHover ? "var(--red-100)" : "transparent",
                  color: removeHover ? "var(--red-600)" : "var(--text-tertiary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Remove question
              </button>
              <Button variant="secondary" size="sm" onClick={onToggleOpen}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [query, setQuery] = useState("");
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allGroups = groupBySection(questions);
  const doneCount = questions.filter(isDone).length;
  const totalCount = questions.length;
  const overallPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const starredCount = questions.filter((q) => q.starred).length;
  const remaining = totalCount - doneCount;

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("section[data-anchor]"));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveAnchor(visible[0].target.getAttribute("data-anchor"));
      },
      { root, rootMargin: "0px 0px -70% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [allGroups.length]);

  const currentActive = activeAnchor ?? allGroups[0]?.anchor ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ padding: "20px 32px 18px", borderBottom: "1px solid var(--border-default)", background: "var(--bg-page)" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-link)",
            font: "700 13px var(--font-body)",
            cursor: "pointer",
            padding: 0,
            marginBottom: 8,
          }}
        >
          ← Interview prep
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div>
            <h1 style={{ margin: 0, font: "800 30px var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              {category?.label ?? categorySlug}
            </h1>
            {category?.description && (
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>{category.description}</p>
            )}
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>+ Add question</Button>
        </div>

        {totalCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 260 }}>
              <div style={{ flex: 1, height: 8, borderRadius: "var(--radius-pill)", background: "var(--ink-100)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--green-600)",
                    width: `${overallPct}%`,
                  }}
                />
              </div>
              <span style={{ font: "var(--text-mono-s)", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                {doneCount}/{totalCount} drafted
              </span>
            </div>
            <div style={{ display: "flex", background: "var(--bg-surface-sunken)", borderRadius: "var(--radius-pill)", padding: 3, gap: 2 }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    height: 30,
                    padding: "0 14px",
                    border: 0,
                    borderRadius: "var(--radius-pill)",
                    fontSize: 13,
                    cursor: "pointer",
                    background: filter === f ? "var(--bg-surface)" : "transparent",
                    color: filter === f ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: filter === f ? 700 : 500,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions"
              style={{
                height: 36,
                flex: 1,
                minWidth: 180,
                maxWidth: 280,
                padding: "0 12px",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-s)",
                background: "var(--bg-surface)",
                fontSize: 14,
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 96px", display: "grid", gridTemplateColumns: allGroups.length > 1 ? "1fr 232px" : "1fr", gap: 40, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 36, minWidth: 0 }}>
            {allGroups.map((group, gi) => {
              const visibleQuestions = group.questions.filter((q) => matchesFilter(q, filter, query));
              if (visibleQuestions.length === 0) return null;
              const catDone = group.questions.filter(isDone).length;
              const catTotal = group.questions.length;
              const catAllDone = catDone === catTotal;
              return (
                <section key={group.anchor} id={group.anchor} data-anchor={group.anchor} style={{ scrollMarginTop: 20 }}>
                  {group.section && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ font: "var(--text-mono-s)", fontSize: 12, color: "var(--text-tertiary)" }}>
                        {String(gi + 1).padStart(2, "0")}
                      </span>
                      <h2 style={{ margin: 0, font: "700 17px var(--font-display)", letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                        {group.section}
                      </h2>
                      <span
                        style={{
                          font: "var(--text-mono-s)",
                          fontSize: 11,
                          color: catAllDone ? "var(--green-700)" : "var(--text-tertiary)",
                          background: catAllDone ? "var(--green-100)" : "var(--bg-surface-sunken)",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-pill)",
                        }}
                      >
                        {catDone} of {catTotal} drafted
                      </span>
                      <div style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {visibleQuestions.map((q) => (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        open={openId === q.id}
                        onToggleOpen={() => setOpenId((prev) => (prev === q.id ? null : q.id))}
                        onToggleStar={() => onEditQuestion({ ...q, starred: !q.starred })}
                        onEditAnswer={(answer) => onEditQuestion({ ...q, answer })}
                        onDelete={() => {
                          onDeleteQuestion(q.id);
                          setOpenId((prev) => (prev === q.id ? null : prev));
                        }}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {totalCount === 0 && (
              <div style={{ padding: "16px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
                No questions yet — add one to get started.
              </div>
            )}
            {totalCount > 0 && allGroups.every((g) => g.questions.filter((q) => matchesFilter(q, filter, query)).length === 0) && (
              <div style={{ border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-m)", padding: 44, textAlign: "center", background: "var(--bg-surface)" }}>
                <p style={{ margin: 0, font: "700 16px var(--font-display)", color: "var(--text-primary)" }}>Nothing matches yet</p>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
                  Try another word, or switch back to all questions.
                </p>
              </div>
            )}
          </div>

          {allGroups.length > 1 && (
            <nav style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 700 }}>
                Categories
              </p>
              {allGroups.map((group) => {
                const catDone = group.questions.filter(isDone).length;
                const catTotal = group.questions.length;
                const active = currentActive === group.anchor;
                return (
                  <a
                    key={group.anchor}
                    href={`#${group.anchor}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: "var(--radius-s)",
                      background: active ? "var(--blue-100)" : "transparent",
                      color: active ? "var(--blue-700)" : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      lineHeight: 1.35,
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ flex: 1 }}>{group.section}</span>
                    <span style={{ font: "var(--text-mono-s)", fontSize: 11, color: catDone === catTotal ? "var(--green-700)" : "var(--text-tertiary)" }}>
                      {catDone}/{catTotal}
                    </span>
                  </a>
                );
              })}
              <div style={{ marginTop: 14, padding: 12, border: "1px solid var(--border-default)", borderRadius: "var(--radius-m)", background: "var(--bg-surface)" }}>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {remaining === 0
                    ? "Every question has a draft. Nice work."
                    : `${starredCount} starred · ${remaining} still blank. Two a day is plenty.`}
                </p>
              </div>
            </nav>
          )}
        </div>
      </div>

      {addDialogOpen && (
        <AddInterviewPrepQuestionDialog
          categorySlug={categorySlug}
          onClose={() => setAddDialogOpen(false)}
          onSave={onAddQuestion}
        />
      )}
    </div>
  );
}
