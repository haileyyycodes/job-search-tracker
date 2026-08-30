"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button, TextLink } from "@/components/ds";
import { interviewPrepCategory } from "@/lib/interviewPrep";
import type { NewElevatorPitchVersion } from "@/lib/dataSource/types";
import type { ElevatorPitchVersion, InterviewPrepQuestion } from "@/lib/types";

interface ElevatorPitchViewProps {
  versions: ElevatorPitchVersion[];
  interviewPrepQuestions: InterviewPrepQuestion[];
  onBack: () => void;
  onAddVersion: (version: NewElevatorPitchVersion) => Promise<ElevatorPitchVersion>;
  onEditVersion: (version: ElevatorPitchVersion) => void;
  onDeleteVersion: (id: number) => void;
}

const SETTINGS = ["Career fair", "Alumni coffee", "Recruiter call", "Cold email/DM", "Conference", "Interview small talk"];
const THEMES = [
  "Problem solver",
  "Analytical thinker",
  "Effective communicator",
  "Innovator",
  "Collaborator",
  "Fast learner",
  "Detail-oriented",
  "Calm under pressure",
];

interface Step {
  id: string;
  label: string;
  done: (v: ElevatorPitchVersion) => boolean;
}

const STEPS: Step[] = [
  { id: "step-setting", label: "Setting", done: (v) => !!v.setting },
  { id: "step-intro", label: "Introduce yourself", done: (v) => !!v.personName || !!v.role },
  { id: "step-story", label: "Proof point", done: (v) => !!v.situation || !!v.action || !!v.result },
  { id: "step-themes", label: "Themes", done: (v) => v.themes.length > 0 || !!v.synthesis },
  { id: "step-ask", label: "The ask", done: (v) => !!v.seeking || !!v.closingQuestion },
];

function blankVersion(name: string): NewElevatorPitchVersion {
  return {
    name,
    setting: "",
    who: "",
    personName: "",
    role: "",
    identity: "",
    situation: "",
    action: "",
    result: "",
    themes: [],
    synthesis: "",
    seeking: "",
    closingQuestion: "",
  };
}

function assemblePitch(v: ElevatorPitchVersion): string {
  const parts: string[] = [];
  if (v.personName || v.role) parts.push(`Hi, I'm ${v.personName || "___"}${v.role ? `, a ${v.role}.` : "."}`);
  if (v.identity) parts.push(v.identity.endsWith(".") ? v.identity : `${v.identity}.`);
  const story = [v.situation, v.action, v.result].filter(Boolean).join(" ");
  if (story) parts.push(story.endsWith(".") ? story : `${story}.`);
  if (v.synthesis) parts.push(v.synthesis.endsWith(".") ? v.synthesis : `${v.synthesis}.`);
  else if (v.themes.length) parts.push(`That experience shows I'm ${v.themes.join(", ").toLowerCase()}.`);
  if (v.seeking) parts.push(`Right now, I'm looking for ${v.seeking}.`);
  if (v.closingQuestion) parts.push(v.closingQuestion.endsWith("?") ? v.closingQuestion : `${v.closingQuestion}?`);
  return parts.join(" ");
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

interface GaugeInfo {
  color: string;
  pct: number;
  hint: string;
}

function gaugeInfo(words: number, seconds: number, target: number): GaugeInfo {
  if (words === 0) {
    return { color: "var(--ink-300)", pct: 0, hint: "Start filling in the steps — your pitch builds itself here." };
  }
  const pct = Math.min(100, Math.round((seconds / target) * 100));
  if (seconds <= target * 1.15) {
    return { color: "var(--green-600)", pct, hint: `Nicely within your ${target}s target — read it aloud once to check the flow.` };
  }
  if (seconds <= target * 1.5) {
    return { color: "var(--yellow-600)", pct, hint: `Running a bit long for ${target}s — trim the proof point or the intro line.` };
  }
  return { color: "var(--red-500)", pct, hint: `Well over ${target}s — cut this down to one story and one ask.` };
}

function fieldStyle(): CSSProperties {
  return {
    width: "100%",
    height: 38,
    padding: "0 12px",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-s)",
    background: "var(--bg-surface-sunken)",
    fontSize: 14,
    color: "var(--text-primary)",
  };
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function StepCard({ num, title, description, children }: { num: string; title: string; description: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-m)",
        padding: "22px 24px",
      }}
    >
      <p style={{ margin: "0 0 2px", font: "var(--text-mono-s)", fontSize: 11, color: "var(--text-tertiary)" }}>{num}</p>
      <h2 style={{ margin: "0 0 4px", font: "700 17px var(--font-display)", color: "var(--text-primary)" }}>{title}</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{description}</p>
      {children}
    </section>
  );
}

interface VersionPillProps {
  version: ElevatorPitchVersion;
  active: boolean;
  deletable: boolean;
  progress: string;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

function VersionPill({ version, active, deletable, progress, onSelect, onRename, onDelete }: VersionPillProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(version.name);

  const commit = () => {
    setEditing(false);
    if (draft.trim()) onRename(draft.trim());
    else setDraft(version.name);
  };

  if (editing) {
    return (
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(version.name);
            setEditing(false);
          }
        }}
        autoFocus
        style={{
          height: 32,
          padding: "0 12px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--blue-400)",
          background: "var(--bg-surface)",
          fontSize: 13,
          fontWeight: 700,
          width: 140,
        }}
      />
    );
  }

  return (
    <button
      onClick={onSelect}
      onDoubleClick={() => setEditing(true)}
      title="Double-click to rename"
      style={{
        height: 32,
        padding: "0 10px 0 14px",
        border: `1px solid ${active ? "var(--blue-300)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-pill)",
        background: active ? "var(--blue-100)" : "var(--bg-surface)",
        color: active ? "var(--blue-700)" : "var(--text-secondary)",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>{version.name}</span>
      <span style={{ font: "var(--text-mono-s)", fontSize: 10.5, color: active ? "var(--blue-700)" : "var(--text-tertiary)" }}>
        {progress}
      </span>
      {deletable && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{ color: "var(--text-tertiary)", fontSize: 12, padding: 2, marginLeft: 2 }}
        >
          ✕
        </span>
      )}
    </button>
  );
}

export function ElevatorPitchView({
  versions,
  interviewPrepQuestions,
  onBack,
  onAddVersion,
  onEditVersion,
  onDeleteVersion,
}: ElevatorPitchViewProps) {
  const [activeId, setActiveId] = useState<number | null>(versions[0]?.id ?? null);
  const [target, setTarget] = useState<30 | 60>(30);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const active = versions.find((v) => v.id === activeId) ?? versions[0] ?? null;

  if (!active) {
    return (
      <div style={{ padding: "20px 32px 40px", overflow: "auto", flex: 1 }}>
        <TextLink onClick={onBack} style={{ font: "700 13px var(--font-body)", display: "inline-block", marginBottom: 16 }}>
          ← Interview prep
        </TextLink>
        <h1 style={{ margin: 0, font: "800 30px var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Elevator pitch
        </h1>
        <p style={{ margin: "4px 0 20px", fontSize: 14, color: "var(--text-secondary)" }}>
          Build a short, conversational introduction — then tailor a version for each audience.
        </p>
        <div style={{ border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-m)", padding: 44, textAlign: "center", background: "var(--bg-surface)" }}>
          <p style={{ margin: 0, font: "700 16px var(--font-display)", color: "var(--text-primary)" }}>No pitch yet</p>
          <p style={{ margin: "6px 0 16px", fontSize: 14, color: "var(--text-secondary)" }}>
            Start with one version — you can tailor more for different audiences later.
          </p>
          <Button onClick={() => void onAddVersion(blankVersion("Career fair")).then((created) => setActiveId(created.id))}>
            + Create your pitch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PitchWizard
      key={active.id}
      version={active}
      versions={versions}
      interviewPrepQuestions={interviewPrepQuestions}
      target={target}
      copied={copied}
      onBack={onBack}
      onSelectVersion={setActiveId}
      onSetTarget={setTarget}
      onAddVersion={(v) => {
        void onAddVersion(v).then((created) => setActiveId(created.id));
      }}
      onRenameVersion={(id, name) => {
        const v = versions.find((x) => x.id === id);
        if (v) onEditVersion({ ...v, name });
      }}
      onDeleteVersion={(id) => {
        onDeleteVersion(id);
        if (id === activeId) setActiveId(null);
      }}
      onEditVersion={onEditVersion}
      onCopy={(text) => {
        if (navigator.clipboard && text) navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 1500);
      }}
    />
  );
}

interface PitchWizardProps {
  version: ElevatorPitchVersion;
  versions: ElevatorPitchVersion[];
  interviewPrepQuestions: InterviewPrepQuestion[];
  target: 30 | 60;
  copied: boolean;
  onBack: () => void;
  onSelectVersion: (id: number) => void;
  onSetTarget: (t: 30 | 60) => void;
  onAddVersion: (v: NewElevatorPitchVersion) => void;
  onRenameVersion: (id: number, name: string) => void;
  onDeleteVersion: (id: number) => void;
  onEditVersion: (v: ElevatorPitchVersion) => void;
  onCopy: (text: string) => void;
}

/** Owns a local draft of the active version so typing doesn't fight the optimistic global
 * state update on every keystroke; text fields commit on blur, chips/select commit immediately. */
function PitchWizard({
  version,
  versions,
  interviewPrepQuestions,
  target,
  copied,
  onBack,
  onSelectVersion,
  onSetTarget,
  onAddVersion,
  onRenameVersion,
  onDeleteVersion,
  onEditVersion,
  onCopy,
}: PitchWizardProps) {
  const [draft, setDraft] = useState(version);

  const commit = (patch: Partial<ElevatorPitchVersion> = {}) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onEditVersion(next);
  };

  const update = (field: keyof ElevatorPitchVersion, value: string) => setDraft((d) => ({ ...d, [field]: value }));
  const blurCommit = () => onEditVersion(draft);

  const pickedQuestion = interviewPrepQuestions.find((q) => q.id === draft.sourceQuestionId);
  const savedAnswer = pickedQuestion?.answer.trim() ?? "";

  const assembledText = assemblePitch(draft);
  const words = wordCount(assembledText);
  const seconds = Math.round((words / 130) * 60);
  const gauge = gaugeInfo(words, seconds, target);
  const doneSteps = STEPS.filter((s) => s.done(draft)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ padding: "20px 32px 18px", borderBottom: "1px solid var(--border-default)", background: "var(--bg-page)" }}>
        <TextLink onClick={onBack} style={{ font: "700 13px var(--font-body)", display: "inline-block", marginBottom: 8 }}>
          ← Interview prep
        </TextLink>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div>
            <h1 style={{ margin: 0, font: "800 30px var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Elevator pitch
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
              Build a short, conversational introduction — then tailor a version for each audience.
            </p>
          </div>
          <Button variant="secondary" onClick={() => onCopy(assembledText)}>
            {copied ? "Copied" : "Copy pitch"}
          </Button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          {versions.map((v) => (
            <VersionPill
              key={v.id}
              version={v}
              active={v.id === version.id}
              deletable={versions.length > 1}
              progress={`${STEPS.filter((s) => s.done(v)).length}/${STEPS.length}`}
              onSelect={() => onSelectVersion(v.id)}
              onRename={(name) => onRenameVersion(v.id, name)}
              onDelete={() => onDeleteVersion(v.id)}
            />
          ))}
          <button
            onClick={() => onAddVersion(blankVersion("New version"))}
            style={{
              height: 32,
              padding: "0 14px",
              border: "1px dashed var(--border-strong)",
              borderRadius: "var(--radius-pill)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + New version
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 40px 96px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
            <nav
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-m)",
                padding: 6,
                position: "sticky",
                top: 0,
                zIndex: 5,
              }}
            >
              {STEPS.map((s) => {
                const done = s.done(draft);
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: "var(--radius-pill)",
                      color: done ? "var(--text-primary)" : "var(--text-secondary)",
                      fontSize: 12.5,
                      fontWeight: done ? 700 : 500,
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        flex: "none",
                        borderRadius: "var(--radius-pill)",
                        border: `1.5px solid ${done ? "var(--green-600)" : "var(--ink-300)"}`,
                        background: done ? "var(--green-600)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        color: "var(--white)",
                      }}
                    >
                      {done ? "✓" : ""}
                    </span>
                    <span>{s.label}</span>
                  </a>
                );
              })}
            </nav>

            <StepCard num="01" title="Who are you talking to?" description="Tailor tone and detail to the setting — a career fair recruiter needs less depth than a warm alumni intro.">
              <div id="step-setting" style={{ scrollMarginTop: 60 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {SETTINGS.map((label) => {
                    const on = draft.setting === label;
                    return (
                      <button
                        key={label}
                        onClick={() => commit({ setting: on ? "" : label })}
                        style={{
                          height: 34,
                          padding: "0 14px",
                          border: `1px solid ${on ? "var(--blue-300)" : "var(--border-default)"}`,
                          borderRadius: "var(--radius-pill)",
                          background: on ? "var(--blue-100)" : "var(--bg-surface)",
                          color: on ? "var(--blue-700)" : "var(--text-secondary)",
                          fontSize: 13,
                          fontWeight: on ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <FieldLabel>Specific person or company (optional)</FieldLabel>
                <input
                  value={draft.who}
                  onChange={(e) => update("who", e.target.value)}
                  onBlur={blurCommit}
                  placeholder="e.g. a recruiter from Figma"
                  style={fieldStyle()}
                />
              </div>
            </StepCard>

            <StepCard num="02" title="Introduce yourself" description="Name, what you do or study, and the one line that says what you're about.">
              <div id="step-intro" style={{ scrollMarginTop: 60 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <input
                      value={draft.personName}
                      onChange={(e) => update("personName", e.target.value)}
                      onBlur={blurCommit}
                      placeholder="Alex Chen"
                      style={fieldStyle()}
                    />
                  </div>
                  <div>
                    <FieldLabel>Role or what you study</FieldLabel>
                    <input
                      value={draft.role}
                      onChange={(e) => update("role", e.target.value)}
                      onBlur={blurCommit}
                      placeholder="senior studying computer science"
                      style={fieldStyle()}
                    />
                  </div>
                </div>
                <FieldLabel>What you&rsquo;re about — one line</FieldLabel>
                <input
                  value={draft.identity}
                  onChange={(e) => update("identity", e.target.value)}
                  onBlur={blurCommit}
                  placeholder="What makes you unique, and what do you want people to remember?"
                  style={fieldStyle()}
                />
              </div>
            </StepCard>

            <StepCard num="03" title="Your strongest proof point" description="One recent story, shortened to its actions and results — this is your evidence, not a full STAR answer.">
              <div id="step-story" style={{ scrollMarginTop: 60 }}>
                <FieldLabel>Pull from a prep question</FieldLabel>
                <select
                  value={draft.sourceQuestionId ?? ""}
                  onChange={(e) => commit({ sourceQuestionId: e.target.value ? Number(e.target.value) : undefined })}
                  style={{ ...fieldStyle(), marginBottom: 10, fontSize: 13.5 }}
                >
                  <option value="">Choose a prep question…</option>
                  {interviewPrepQuestions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {(interviewPrepCategory(q.category)?.label ?? q.category)} — {q.question}
                    </option>
                  ))}
                </select>

                {pickedQuestion && (
                  <div style={{ background: "var(--bg-surface-sunken)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-s)", padding: "12px 14px", marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.45 }}>
                      &ldquo;{pickedQuestion.question}&rdquo;
                    </p>
                    {savedAnswer ? (
                      <>
                        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {savedAnswer}
                        </p>
                        <Button size="sm" onClick={() => commit({ situation: savedAnswer })} style={{ marginTop: 10 }}>
                          Use this draft as my story
                        </Button>
                      </>
                    ) : (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>
                        No draft yet for this one — answer it on its prep page, or write the story below.
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <FieldLabel>Situation &amp; task</FieldLabel>
                    <input
                      value={draft.situation}
                      onChange={(e) => update("situation", e.target.value)}
                      onBlur={blurCommit}
                      placeholder="Recently, I worked on..."
                      style={fieldStyle()}
                    />
                  </div>
                  <div>
                    <FieldLabel>What you did</FieldLabel>
                    <input
                      value={draft.action}
                      onChange={(e) => update("action", e.target.value)}
                      onBlur={blurCommit}
                      placeholder="I..."
                      style={fieldStyle()}
                    />
                  </div>
                  <div>
                    <FieldLabel>The result</FieldLabel>
                    <input
                      value={draft.result}
                      onChange={(e) => update("result", e.target.value)}
                      onBlur={blurCommit}
                      placeholder="which resulted in..."
                      style={fieldStyle()}
                    />
                  </div>
                </div>
              </div>
            </StepCard>

            <StepCard num="04" title="What does that prove about you?" description="Pick the themes your story shows, then tie them together in a sentence.">
              <div id="step-themes" style={{ scrollMarginTop: 60 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {THEMES.map((label) => {
                    const on = draft.themes.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => commit({ themes: on ? draft.themes.filter((t) => t !== label) : [...draft.themes, label] })}
                        style={{
                          height: 32,
                          padding: "0 13px",
                          border: `1px solid ${on ? "var(--green-300)" : "var(--border-default)"}`,
                          borderRadius: "var(--radius-pill)",
                          background: on ? "var(--green-100)" : "var(--bg-surface)",
                          color: on ? "var(--green-700)" : "var(--text-secondary)",
                          fontSize: 12.5,
                          fontWeight: on ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <FieldLabel>Tie it together</FieldLabel>
                <input
                  value={draft.synthesis}
                  onChange={(e) => update("synthesis", e.target.value)}
                  onBlur={blurCommit}
                  placeholder="That experience is a good example of how I..."
                  style={fieldStyle()}
                />
              </div>
            </StepCard>

            <StepCard num="05" title="What you're looking for — and your question" description="End on something conversational. A specific ask, or a question back to them, keeps it from sounding like a monologue.">
              <div id="step-ask" style={{ scrollMarginTop: 60, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <FieldLabel>What you&rsquo;re looking for next</FieldLabel>
                  <input
                    value={draft.seeking}
                    onChange={(e) => update("seeking", e.target.value)}
                    onBlur={blurCommit}
                    placeholder="a summer internship in..."
                    style={fieldStyle()}
                  />
                </div>
                <div>
                  <FieldLabel>Your closing question to them</FieldLabel>
                  <input
                    value={draft.closingQuestion}
                    onChange={(e) => update("closingQuestion", e.target.value)}
                    onBlur={blurCommit}
                    placeholder="Can you tell me about...?"
                    style={fieldStyle()}
                  />
                </div>
              </div>
            </StepCard>
          </div>

          <aside style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-m)", padding: 18, boxShadow: "var(--shadow-s)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 700 }}>
                  Your pitch
                </p>
                <div style={{ display: "flex", background: "var(--bg-surface-sunken)", borderRadius: "var(--radius-pill)", padding: 2 }}>
                  {([30, 60] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => onSetTarget(t)}
                      style={{
                        height: 24,
                        padding: "0 9px",
                        border: 0,
                        borderRadius: "var(--radius-pill)",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        background: target === t ? "var(--bg-surface)" : "transparent",
                        color: target === t ? "var(--text-primary)" : "var(--text-tertiary)",
                      }}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>
              {assembledText ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)" }}>{assembledText}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>
                  Fill in the steps on the left and your pitch builds itself here.
                </p>
              )}
              <div style={{ marginTop: 14, height: 6, borderRadius: "var(--radius-pill)", background: "var(--ink-100)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "var(--radius-pill)", background: gauge.color, width: `${gauge.pct}%`, transition: "width 200ms ease-out" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ font: "var(--text-mono-s)", fontSize: 11.5, color: "var(--text-tertiary)" }}>{words} words</span>
                <span style={{ font: "var(--text-mono-s)", fontSize: 11.5, fontWeight: 700, color: gauge.color }}>~{seconds}s spoken</span>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.5 }}>{gauge.hint}</p>
            </div>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-m)", padding: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 700 }}>
                {draft.name} — progress
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 8, borderRadius: "var(--radius-pill)", background: "var(--ink-100)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "var(--radius-pill)", background: "var(--green-600)", width: `${Math.round((doneSteps / STEPS.length) * 100)}%` }} />
                </div>
                <span style={{ font: "var(--text-mono-s)", fontSize: 12, color: "var(--text-secondary)" }}>
                  {doneSteps}/{STEPS.length}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
