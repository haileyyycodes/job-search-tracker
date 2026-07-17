"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input, Select, Switch } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { isValidUrl } from "@/lib/validation";
import { ContactPicker } from "./ContactPicker";
import { CompanyPicker } from "./CompanyPicker";
import type { Company, Contact, WorkArrangement } from "@/lib/types";

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
  onCreateContact: (contact: Contact) => void;
  companies: Company[];
  onCreateCompany: (company: Company) => void;
}

/**
 * Company and job title are always required; date applied is required unless the application is
 * still queued as "to do" (not applied yet). The link, if provided, must be a well-formed URL.
 * Salary: max cannot be set without a min, and min must be <= max (mirrors the Goals salary validation).
 */
export function isApplicationFormValid(form: ApplicationFormValues, requireDateApplied = true): boolean {
  if (!form.companyId || !form.role.trim()) return false;
  if (requireDateApplied && !form.dateApplied) return false;
  if (form.link.trim() && !isValidUrl(form.link.trim())) return false;
  const min = form.salaryMin.trim() ? Number(form.salaryMin) : undefined;
  const max = form.salaryMax.trim() ? Number(form.salaryMax) : undefined;
  if (max != null && min == null) return false;
  if (min != null && max != null && min > max) return false;
  return true;
}

/** Field set shared between AddApplicationDialog and EditApplicationDialog. */
export function ApplicationFormFields({
  form,
  setForm,
  submitted,
  requireDateApplied = true,
  contacts,
  onCreateContact,
  companies,
  onCreateCompany,
}: ApplicationFormFieldsProps) {
  const min = form.salaryMin.trim() ? Number(form.salaryMin) : undefined;
  const max = form.salaryMax.trim() ? Number(form.salaryMax) : undefined;
  const maxWithoutMin = max != null && min == null;
  const minAboveMax = min != null && max != null && min > max;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto", overflowX: "hidden" }}>
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
      <div style={{ display: "flex", gap: 12 }}>
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
        label="Work arrangement"
        value={form.workArrangement}
        options={workArrangementOptions}
        onChange={(v) => setForm((f) => ({ ...f, workArrangement: v as WorkArrangement }))}
        placeholder="Not specified"
      />
      {(form.workArrangement === "onsite" || form.workArrangement === "hybrid") && (
        <div style={{ display: "flex", gap: 12 }}>
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
