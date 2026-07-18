"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input, Select, IconButton, Button, Switch } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { isValidUrl } from "@/lib/validation";
import { companyStatusLabels } from "@/lib/companies";
import type { CompanyLocation, CompanyStatus } from "@/lib/types";

const statusOptions: SelectOption[] = (Object.keys(companyStatusLabels) as CompanyStatus[]).map((s) => ({
  value: s,
  label: companyStatusLabels[s],
}));

export interface CompanyFormValues {
  name: string;
  industry: string;
  website: string;
  notes: string;
  isTarget: boolean;
  status: CompanyStatus;
  locations: CompanyLocation[];
}

export const emptyCompanyForm: CompanyFormValues = {
  name: "",
  industry: "",
  website: "",
  notes: "",
  isTarget: true,
  status: "researching",
  locations: [],
};

/** Name is the only required field; website must be well-formed if provided. Empty location rows are dropped at save. */
export function isCompanyFormValid(form: CompanyFormValues): boolean {
  if (!form.name.trim()) return false;
  if (form.website.trim() && !isValidUrl(form.website.trim())) return false;
  return true;
}

interface CompanyFormFieldsProps {
  form: CompanyFormValues;
  setForm: Dispatch<SetStateAction<CompanyFormValues>>;
  submitted: boolean;
}

/** Field set shared between AddCompanyDialog and EditCompanyDialog. */
export function CompanyFormFields({ form, setForm, submitted }: CompanyFormFieldsProps) {
  const updateLocation = (index: number, patch: Partial<CompanyLocation>) =>
    setForm((f) => ({
      ...f,
      locations: f.locations.map((loc, i) => (i === index ? { ...loc, ...patch } : loc)),
    }));

  const removeLocation = (index: number) =>
    setForm((f) => ({ ...f, locations: f.locations.filter((_, i) => i !== index) }));

  const addLocation = () =>
    setForm((f) => ({ ...f, locations: [...f.locations, { city: "", state: "" }] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto", overflowX: "hidden" }}>
      <Input
        label="Company name"
        placeholder="e.g. Northwind Co."
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        error={submitted && !form.name.trim() ? "Required" : undefined}
      />
      <Input
        label="Industry"
        placeholder="e.g. Product design / SaaS"
        hint="Optional"
        value={form.industry}
        onChange={(v) => setForm((f) => ({ ...f, industry: v }))}
      />
      <Input
        label="Website"
        placeholder="https://…"
        hint="Optional"
        value={form.website}
        onChange={(v) => setForm((f) => ({ ...f, website: v }))}
        error={submitted && form.website.trim() && !isValidUrl(form.website.trim()) ? "Enter a valid URL" : undefined}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Switch
          checked={form.isTarget}
          onChange={(checked) => setForm((f) => ({ ...f, isTarget: checked }))}
          label="★ Target company"
        />
      </div>
      {form.isTarget && <Select label="Status" value={form.status} options={statusOptions} onChange={(v) => setForm((f) => ({ ...f, status: v as CompanyStatus }))} />}
      <div>
        <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Locations
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {form.locations.map((loc, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <Input placeholder="City" value={loc.city} onChange={(v) => updateLocation(i, { city: v })} />
              </div>
              <div style={{ flex: 1 }}>
                <Input placeholder="State" value={loc.state} onChange={(v) => updateLocation(i, { state: v })} />
              </div>
              <IconButton aria-label="Remove location" icon={<span>✕</span>} onClick={() => removeLocation(i)} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <Button type="button" variant="ghost" size="sm" onClick={addLocation}>
            + Add location
          </Button>
        </div>
      </div>
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
