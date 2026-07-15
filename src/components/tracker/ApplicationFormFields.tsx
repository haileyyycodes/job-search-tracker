"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input, Switch } from "@/components/ds";
import { isValidUrl } from "@/lib/validation";

export interface ApplicationFormValues {
  company: string;
  role: string;
  dateApplied: string;
  link: string;
  description: string;
  referral: boolean;
  referredBy: string;
  notes: string;
}

export const emptyApplicationForm: ApplicationFormValues = {
  company: "",
  role: "",
  dateApplied: "",
  link: "",
  description: "",
  referral: false,
  referredBy: "",
  notes: "",
};

interface ApplicationFormFieldsProps {
  form: ApplicationFormValues;
  setForm: Dispatch<SetStateAction<ApplicationFormValues>>;
  submitted: boolean;
}

/** Company, job title, and date applied are required; the link, if provided, must be a well-formed URL. */
export function isApplicationFormValid(form: ApplicationFormValues): boolean {
  if (!form.company.trim() || !form.role.trim() || !form.dateApplied) return false;
  if (form.link.trim() && !isValidUrl(form.link.trim())) return false;
  return true;
}

/** Field set shared between AddApplicationDialog and EditApplicationDialog. */
export function ApplicationFormFields({ form, setForm, submitted }: ApplicationFormFieldsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflow: "auto" }}>
      <Input
        label="Company"
        placeholder="e.g. Northwind Co."
        value={form.company}
        onChange={(v) => setForm((f) => ({ ...f, company: v }))}
        error={submitted && !form.company.trim() ? "Required" : undefined}
      />
      <Input
        label="Job title"
        placeholder="e.g. Product Designer"
        value={form.role}
        onChange={(v) => setForm((f) => ({ ...f, role: v }))}
        error={submitted && !form.role.trim() ? "Required" : undefined}
      />
      <Input
        label="Date applied"
        type="date"
        value={form.dateApplied}
        onChange={(v) => setForm((f) => ({ ...f, dateApplied: v }))}
        error={submitted && !form.dateApplied ? "Required" : undefined}
      />
      <Input
        label="Application link"
        placeholder="https://…"
        hint="Optional"
        value={form.link}
        onChange={(v) => setForm((f) => ({ ...f, link: v }))}
        error={submitted && form.link.trim() && !isValidUrl(form.link.trim()) ? "Enter a valid URL" : undefined}
      />
      <div>
        <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Resume
        </label>
        <input type="file" accept=".pdf,.docx" style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }} />
      </div>
      <div>
        <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Job description
        </label>
        <textarea
          placeholder="Paste the job description…"
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          style={{
            width: "100%",
            padding: 10,
            border: "1.5px solid var(--border-default)",
            borderRadius: "var(--radius-s)",
            font: "var(--text-body-s)",
            color: "var(--text-primary)",
            resize: "vertical",
          }}
        />
      </div>
      <Switch
        label="I had a referral"
        checked={form.referral}
        onChange={(checked) => setForm((f) => ({ ...f, referral: checked }))}
      />
      {form.referral && (
        <Input
          label="Referred by"
          placeholder="Name of referrer"
          value={form.referredBy}
          onChange={(v) => setForm((f) => ({ ...f, referredBy: v }))}
        />
      )}
      <div>
        <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Notes
        </label>
        <textarea
          placeholder="Anything you want to remember about this one…"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          style={{
            width: "100%",
            padding: 10,
            border: "1.5px solid var(--border-default)",
            borderRadius: "var(--radius-s)",
            font: "var(--text-body-s)",
            color: "var(--text-primary)",
            resize: "vertical",
          }}
        />
      </div>
    </div>
  );
}
