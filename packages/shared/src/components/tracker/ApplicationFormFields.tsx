"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { Button, Input, Select, Switch } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { isValidUrl } from "@/lib/validation";
import { resumeTypeOptions } from "@/lib/data";
import { formatFileSize } from "@/lib/resumeFile";
import { validateResumeFile } from "@/lib/resumeUpload";
import { RESUME_UPLOAD_ENABLED } from "@/lib/featureFlags";
import { ContactPicker } from "./ContactPicker";
import { CompanyPicker } from "./CompanyPicker";
import type { NewCompany, NewContact } from "@/lib/dataSource/types";
import type { Company, Contact, ResumeFile, ResumeType, WorkArrangement } from "@/lib/types";

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
  /** The attached resume file, validated and base64-encoded, ready to persist via
   * `setResumeFile`. `null` when nothing is attached. Populated with metadata only
   * (`data: ""`) when editing an application that already has a stored file and
   * the user hasn't picked a new one. */
  resumeFile: ResumeFile | null;
  /** Client-side validation message for the last rejected pick, if any. */
  resumeFileError: string;
  coverLetterSubmitted: boolean;
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
  resumeFile: null,
  resumeFileError: "",
  coverLetterSubmitted: false,
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

/** Resume-file storage is desktop-only (real persistence). Read deferred to a
 * post-mount effect to avoid an SSR/hydration mismatch — server and first client
 * render assume the web demo, then this upgrades if we're in Electron. */
function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const detect = () => setDesktop(typeof window !== "undefined" && !!window.electronAPI);
    detect();
  }, []);
  return desktop;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stacked = useStacked();
  const isDesktop = useIsDesktop();
  // Feature-flagged for now: the control still renders (disabled) everywhere, but
  // upload/storage only works in the desktop build once the flag is on.
  const resumeUploadAvailable = RESUME_UPLOAD_ENABLED && isDesktop;

  const handleResumePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file after an error
    if (!picked) return;
    const result = await validateResumeFile(picked);
    if (result.ok) {
      setForm((f) => ({ ...f, resumeFile: result.file, resumeFileError: "" }));
    } else {
      setForm((f) => ({ ...f, resumeFile: null, resumeFileError: result.error }));
    }
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
            Paste the posting here so you can reference it while you fill in the details.
          </span>
        </div>
        <textarea
          placeholder="Paste the job description…"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <label style={fieldLabelStyle}>Resume</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumePick}
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            />
            <Button
              variant="secondary"
              size="md"
              disabled={!resumeUploadAvailable}
              onClick={() => fileInputRef.current?.click()}
            >
              {form.resumeFile ? "Replace file" : "Choose file"}
            </Button>
            <span
              style={{
                font: "var(--text-caption)",
                color: form.resumeFileError ? "var(--red-600)" : "var(--text-tertiary)",
                display: "block",
                marginTop: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {!RESUME_UPLOAD_ENABLED
                ? "Resume upload isn’t available yet."
                : !isDesktop
                  ? "Resume upload is only available in the desktop app."
                  : form.resumeFileError
                    ? form.resumeFileError
                    : form.resumeFile
                      ? `${form.resumeFile.name} · ${formatFileSize(form.resumeFile.size)}`
                      : "PDF or Word (.pdf, .doc, .docx), up to 2 MB."}
            </span>
            {resumeUploadAvailable && form.resumeFile && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, resumeFile: null, resumeFileError: "" }))}
                style={{
                  marginTop: 4,
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "var(--text-caption)",
                  color: "var(--accent-primary)",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            )}
          </div>
          <Select
            label="Resume version"
            value={form.resumeType}
            options={resumeTypeOptions}
            onChange={(v) => setForm((f) => ({ ...f, resumeType: v as ResumeType }))}
            placeholder="Choose one"
            error={submitted && !form.resumeType ? "Required" : undefined}
          />
        </div>

        <Switch
          label="Cover letter submitted"
          checked={form.coverLetterSubmitted}
          onChange={(checked) => setForm((f) => ({ ...f, coverLetterSubmitted: checked }))}
        />

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
