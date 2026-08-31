"use client";

import { useEffect, useState } from "react";
import type { ClipboardEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { Input, Select, Switch } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { isValidUrl } from "@/lib/validation";
import { resumeTypeOptions } from "@/lib/data";
import { htmlToMarkdown, MAX_RICH_TEXT_CHARS } from "@/lib/richText";
import { ContactPicker } from "./ContactPicker";
import { CompanyPicker } from "./CompanyPicker";
import type { NewCompany, NewContact } from "@/lib/dataSource/types";
import type { Company, Contact, ResumeType, WorkArrangement } from "@/lib/types";

const workArrangementOptions: SelectOption[] = [
  { value: "onsite", label: "Onsite" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export interface ApplicationFormValues {
  companyId: string;
  role: string;
  dateApplied: string;
  link: string;
  description: string;
  referral: boolean;
  referredByContactId: string;
  resumeType: ResumeType | "";
  /** Free-text copy of the resume sent for this application, pasted by the user. */
  resumeText: string;
  /** Free-text copy of the cover letter. `coverLetterSubmitted` on the saved
   * application is derived from whether this is non-empty. */
  coverLetterText: string;
  notes: string;
  salaryMin: string;
  salaryMax: string;
  workArrangement: WorkArrangement | "";
  city: string;
  state: string;
}

export const emptyApplicationForm: ApplicationFormValues = {
  companyId: "",
  role: "",
  dateApplied: "",
  link: "",
  description: "",
  referral: false,
  referredByContactId: "",
  resumeType: "",
  resumeText: "",
  coverLetterText: "",
  notes: "",
  salaryMin: "",
  salaryMax: "",
  workArrangement: "",
  city: "",
  state: "",
};

interface ApplicationFormFieldsProps {
  form: ApplicationFormValues;
  setForm: Dispatch<SetStateAction<ApplicationFormValues>>;
  submitted: boolean;
  requireDateApplied?: boolean;
  contacts: Contact[];
  onCreateContact: (contact: NewContact) => Promise<Contact>;
  companies: Company[];
  onCreateCompany: (company: NewCompany) => Promise<Company>;
  /** Rendered at the top of the form column, above Company — the Add flow slots
   * its "Status" select here; the Edit flow leaves it empty. */
  leadingField?: ReactNode;
}

/**
 * Company and job title are always required; date applied is required unless the application is
 * still queued as "to do" (not applied yet). The link, if provided, must be a well-formed URL.
 * Salary: max cannot be set without a min, and min must be <= max (mirrors the Goals salary validation).
 */
export function isApplicationFormValid(form: ApplicationFormValues, requireDateApplied = true): boolean {
  if (!form.companyId || !form.role.trim()) return false;
  if (requireDateApplied && !form.dateApplied) return false;
  if (!form.resumeType) return false;
  if (form.link.trim() && !isValidUrl(form.link.trim())) return false;
  const min = form.salaryMin.trim() ? Number(form.salaryMin) : undefined;
  const max = form.salaryMax.trim() ? Number(form.salaryMax) : undefined;
  if (max != null && min == null) return false;
  if (min != null && max != null && min > max) return false;
  return true;
}

const fieldLabelStyle = {
  font: "var(--text-label)",
  color: "var(--text-secondary)",
  letterSpacing: "0.02em",
  display: "block",
  marginBottom: 6,
} as const;

const textareaStyle = {
  width: "100%",
  padding: 10,
  border: "1.5px solid var(--border-default)",
  borderRadius: "var(--radius-s)",
  font: "var(--text-body-s)",
  color: "var(--text-primary)",
  background: "var(--bg-surface)",
  resize: "vertical",
  boxSizing: "border-box",
} as const;

/** Two-column: below this the description panel stacks above the form. */
const STACK_BELOW = 900;

function useStacked(): boolean {
  const [stacked, setStacked] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${STACK_BELOW}px)`);
    const sync = () => setStacked(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return stacked;
}

/**
 * Field set shared between AddApplicationDialog and EditApplicationDialog. Renders the
 * dialog's whole body: a left reference panel for the job description (with live word
 * count) beside a scrollable column of application details.
 */
export function ApplicationFormFields({
  form,
  setForm,
  submitted,
  requireDateApplied = true,
  contacts,
  onCreateContact,
  companies,
  onCreateCompany,
  leadingField,
}: ApplicationFormFieldsProps) {
  const stacked = useStacked();

  /** On a rich (HTML) paste, drop Markdown in at the cursor instead of raw markup;
   * a plain-text paste falls through to the textarea's default behavior. */
  const handleRichPaste =
    (field: "description" | "resumeText" | "coverLetterText") => (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const html = e.clipboardData.getData("text/html");
      if (!html.trim()) return;
      e.preventDefault();
      const el = e.currentTarget;
      const md = htmlToMarkdown(html);
      // Keep block Markdown parseable: separate it from any text it lands next to.
      const before = el.value.slice(0, el.selectionStart);
      const prefix = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
      el.setRangeText(prefix + md, el.selectionStart, el.selectionEnd, "end");
      const next = el.value.slice(0, MAX_RICH_TEXT_CHARS);
      setForm((f) => ({ ...f, [field]: next }));
    };

  const min = form.salaryMin.trim() ? Number(form.salaryMin) : undefined;
  const max = form.salaryMax.trim() ? Number(form.salaryMax) : undefined;
  const maxWithoutMin = max != null && min == null;
  const minAboveMax = min != null && max != null && min > max;

  const words = form.description.trim() ? form.description.trim().split(/\s+/).length : 0;
  const wordCountLabel = words === 1 ? "1 word" : `${words} words`;
  const showLocation = form.workArrangement === "onsite" || form.workArrangement === "hybrid";

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        overflow: "hidden",
      }}
    >
      {/* Job description reference panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flex: stacked ? "0 0 auto" : "0 0 42%",
          minWidth: stacked ? undefined : 340,
          maxWidth: stacked ? undefined : 560,
          padding: 24,
          background: "var(--bg-surface-sunken)",
          borderRight: stacked ? "none" : "1px solid var(--border-default)",
          borderBottom: stacked ? "1px solid var(--border-default)" : "none",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>
            Job description
          </label>
          <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
            Paste the posting here to reference it — formatting is kept as Markdown.
          </span>
        </div>
        <textarea
          placeholder="Paste the job description…"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          onPaste={handleRichPaste("description")}
          style={{
            flex: 1,
            width: "100%",
            minHeight: stacked ? 140 : 120,
            padding: 14,
            border: "1.5px solid var(--border-default)",
            borderRadius: "var(--radius-s)",
            font: "var(--text-body-s)",
            color: "var(--text-primary)",
            background: "var(--bg-surface)",
            resize: "none",
            boxSizing: "border-box",
          }}
        />
        <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)", alignSelf: "flex-end" }}>
          {wordCountLabel}
        </span>
      </div>

      {/* Application details */}
      <div style={{ flex: 1, minWidth: stacked ? undefined : 360, overflowY: "auto", boxSizing: "border-box" }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {leadingField}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <CompanyPicker
            label="Company"
            companies={companies}
            value={form.companyId}
            onChange={(id) => setForm((f) => ({ ...f, companyId: id }))}
            onCreateCompany={onCreateCompany}
            error={submitted && !form.companyId ? "Required" : undefined}
          />
          <Input
            label="Job title"
            placeholder="e.g. Product Designer"
            value={form.role}
            onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            error={submitted && !form.role.trim() ? "Required" : undefined}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label={requireDateApplied ? "Date applied" : "Date applied (optional)"}
            type="date"
            value={form.dateApplied}
            onChange={(v) => setForm((f) => ({ ...f, dateApplied: v }))}
            error={submitted && requireDateApplied && !form.dateApplied ? "Required" : undefined}
            hint={!requireDateApplied ? "Leave blank until you actually apply" : undefined}
          />
          <Input
            label="Application link"
            placeholder="https://…"
            hint="Optional"
            value={form.link}
            onChange={(v) => setForm((f) => ({ ...f, link: v }))}
            error={submitted && form.link.trim() && !isValidUrl(form.link.trim()) ? "Enter a valid URL" : undefined}
          />
        </div>

        <Select
          label="Work arrangement"
          value={form.workArrangement}
          options={workArrangementOptions}
          onChange={(v) => setForm((f) => ({ ...f, workArrangement: v as WorkArrangement }))}
          placeholder="Not specified"
        />
        {showLocation && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="City"
              placeholder="e.g. Detroit"
              hint="Optional"
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
            />
            <Input
              label="State"
              placeholder="e.g. MI"
              hint="Optional"
              value={form.state}
              onChange={(v) => setForm((f) => ({ ...f, state: v }))}
            />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Salary band — minimum"
            type="number"
            placeholder="e.g. 100000"
            hint="Optional"
            value={form.salaryMin}
            onChange={(v) => setForm((f) => ({ ...f, salaryMin: v }))}
            error={submitted && minAboveMax ? "Must be ≤ maximum" : undefined}
          />
          <Input
            label="Salary band — maximum"
            type="number"
            placeholder="e.g. 140000"
            hint="Optional"
            value={form.salaryMax}
            onChange={(v) => setForm((f) => ({ ...f, salaryMax: v }))}
            error={submitted && maxWithoutMin ? "Enter a minimum first" : undefined}
          />
        </div>

        <Select
          label="Resume version"
          value={form.resumeType}
          options={resumeTypeOptions}
          onChange={(v) => setForm((f) => ({ ...f, resumeType: v as ResumeType }))}
          placeholder="Choose one"
          error={submitted && !form.resumeType ? "Required" : undefined}
        />

        <div>
          <label style={fieldLabelStyle}>Resume</label>
          <textarea
            placeholder="Paste the resume text you sent for this application…"
            rows={5}
            value={form.resumeText}
            onChange={(e) => setForm((f) => ({ ...f, resumeText: e.target.value }))}
            onPaste={handleRichPaste("resumeText")}
            style={textareaStyle}
          />
          <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)", display: "block", marginTop: 4 }}>
            Formatting is kept as Markdown.
          </span>
        </div>

        <div>
          <label style={fieldLabelStyle}>Cover letter</label>
          <textarea
            placeholder="Paste the cover letter you sent for this application…"
            rows={5}
            value={form.coverLetterText}
            onChange={(e) => setForm((f) => ({ ...f, coverLetterText: e.target.value }))}
            onPaste={handleRichPaste("coverLetterText")}
            style={textareaStyle}
          />
          <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)", display: "block", marginTop: 4 }}>
            Formatting is kept as Markdown.
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Switch
            label="I had a referral"
            checked={form.referral}
            onChange={(checked) => setForm((f) => ({ ...f, referral: checked }))}
          />
          {form.referral && (
            <ContactPicker
              label="Referred by"
              contacts={contacts}
              companies={companies}
              value={form.referredByContactId}
              onChange={(id) => setForm((f) => ({ ...f, referredByContactId: id }))}
              onCreateContact={onCreateContact}
              defaultCompanyId={form.companyId || undefined}
            />
          )}
        </div>

        <div>
          <label style={fieldLabelStyle}>Notes</label>
          <textarea
            placeholder="Anything you want to remember about this one…"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            style={textareaStyle}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
