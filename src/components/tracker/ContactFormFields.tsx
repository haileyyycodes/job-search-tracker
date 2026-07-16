"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ds";
import { isValidEmail, isValidUrl } from "@/lib/validation";

export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  website: string;
  employer: string;
  role: string;
  notes: string;
}

export const emptyContactForm: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  linkedInUrl: "",
  website: "",
  employer: "",
  role: "",
  notes: "",
};

/** Name is the only required field; email, LinkedIn, and website must be well-formed if provided. */
export function isContactFormValid(form: ContactFormValues): boolean {
  if (!form.name.trim()) return false;
  if (form.email.trim() && !isValidEmail(form.email.trim())) return false;
  if (form.linkedInUrl.trim() && !isValidUrl(form.linkedInUrl.trim())) return false;
  if (form.website.trim() && !isValidUrl(form.website.trim())) return false;
  return true;
}

interface ContactFormFieldsProps {
  form: ContactFormValues;
  setForm: Dispatch<SetStateAction<ContactFormValues>>;
  submitted: boolean;
}

/** Field set shared between AddContactDialog and EditContactDialog. */
export function ContactFormFields({ form, setForm, submitted }: ContactFormFieldsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto", overflowX: "hidden" }}>
      <Input
        label="Name"
        placeholder="e.g. Alex Chen"
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        error={submitted && !form.name.trim() ? "Required" : undefined}
      />
      <Input
        label="Email"
        placeholder="e.g. alex@company.com"
        hint="Optional"
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        error={submitted && form.email.trim() && !isValidEmail(form.email.trim()) ? "Enter a valid email" : undefined}
      />
      <Input
        label="Phone"
        placeholder="e.g. (555) 123-4567"
        hint="Optional"
        value={form.phone}
        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
      />
      <Input
        label="LinkedIn profile"
        placeholder="https://linkedin.com/in/…"
        hint="Optional"
        value={form.linkedInUrl}
        onChange={(v) => setForm((f) => ({ ...f, linkedInUrl: v }))}
        error={
          submitted && form.linkedInUrl.trim() && !isValidUrl(form.linkedInUrl.trim()) ? "Enter a valid URL" : undefined
        }
      />
      <Input
        label="Personal website"
        placeholder="https://…"
        hint="Optional"
        value={form.website}
        onChange={(v) => setForm((f) => ({ ...f, website: v }))}
        error={submitted && form.website.trim() && !isValidUrl(form.website.trim()) ? "Enter a valid URL" : undefined}
      />
      <Input
        label="Employer"
        placeholder="e.g. Northwind Co."
        hint="Optional"
        value={form.employer}
        onChange={(v) => setForm((f) => ({ ...f, employer: v }))}
      />
      <Input
        label="Role"
        placeholder="e.g. Product Design"
        hint="Optional"
        value={form.role}
        onChange={(v) => setForm((f) => ({ ...f, role: v }))}
      />
      <div>
        <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Notes
        </label>
        <textarea
          placeholder="How you know them, anything worth remembering…"
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
