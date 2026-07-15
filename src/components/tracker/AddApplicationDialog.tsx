"use client";

import { useState } from "react";
import { Dialog, Input, Button, Switch } from "@/components/ds";

interface AddApplicationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddApplicationDialog({ open, onClose }: AddApplicationDialogProps) {
  const [referral, setReferral] = useState(false);

  return (
    <Dialog
      open={open}
      title="Log application"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onClose}>
            Save application
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflow: "auto" }}>
        <Input label="Company" placeholder="e.g. Northwind Co." />
        <Input label="Job title" placeholder="e.g. Product Designer" />
        <Input label="Date applied" type="date" />
        <Input label="Application link" placeholder="https://…" hint="Optional" />
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
        <Switch label="I had a referral" checked={referral} onChange={setReferral} />
        {referral && <Input label="Referred by" placeholder="Name of referrer" />}
        <div>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Notes
          </label>
          <textarea
            placeholder="Anything you want to remember about this one…"
            rows={3}
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
