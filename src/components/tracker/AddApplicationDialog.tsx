"use client";

import { useState } from "react";
import { Dialog, Input, Button, Switch } from "@/components/ds";
import { formatDateInput, todayFormatted } from "@/lib/date";
import type { Application } from "@/lib/types";

interface AddApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (app: Application) => void;
}

const emptyForm = {
  company: "",
  role: "",
  dateApplied: "",
  link: "",
  description: "",
  referral: false,
  referredBy: "",
  notes: "",
};

export function AddApplicationDialog({ open, onClose, onAdd }: AddApplicationDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const resetAndClose = () => {
    setForm(emptyForm);
    setSubmitted(false);
    onClose();
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!form.company.trim() || !form.role.trim()) return;

    const dateApplied = form.dateApplied ? formatDateInput(form.dateApplied) : todayFormatted();
    const newApp: Application = {
      id: crypto.randomUUID(),
      company: form.company.trim(),
      role: form.role.trim(),
      dateApplied,
      link: form.link.trim(),
      jobDescription: form.description.trim(),
      referral: form.referral,
      referredBy: form.referral ? form.referredBy.trim() || undefined : undefined,
      notes: form.notes.trim(),
      status: "applied",
      logo: form.company.trim().charAt(0).toUpperCase() || "?",
      statusHistory: [{ status: "applied", at: dateApplied }],
      interviews: [],
      followUps: [],
    };

    onAdd(newApp);
    resetAndClose();
  };

  return (
    <Dialog
      open={open}
      title="Log application"
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save application
          </Button>
        </>
      }
    >
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
          hint="Defaults to today if left blank"
        />
        <Input
          label="Application link"
          placeholder="https://…"
          hint="Optional"
          value={form.link}
          onChange={(v) => setForm((f) => ({ ...f, link: v }))}
        />
        <div>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Resume
          </label>
          <input
            type="file"
            accept=".pdf,.docx"
            style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}
          />
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
    </Dialog>
  );
}
