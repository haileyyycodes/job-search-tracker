"use client";

import { useEffect, useState } from "react";
import { Dialog, Button } from "@/components/ds";

const STORAGE_KEY = "job-tracker:demo-notice-dismissed";

/** Only rendered in the web build (never Electron, where window.electronAPI is present).
 * Shows once per browser to explain that this is a portfolio demo with fake, unsaved data. */
export function DemoNoticeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.electronAPI) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage unavailable (e.g. private browsing) — fall through and show the notice
    }
    setOpen(true);
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // if storage isn't available the notice will just show again next visit
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      title="You're exploring a demo"
      onClose={dismiss}
      footer={
        <Button size="sm" onClick={dismiss}>
          Got it
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, font: "var(--text-body-m)", color: "var(--text-primary)" }}>
          This site is a live demo built to showcase Job Tracker — every application, contact, and company you
          see is made-up sample data, not anyone&rsquo;s real job search.
        </p>
        <p style={{ margin: 0, font: "var(--text-body-m)", color: "var(--text-primary)" }}>
          Feel free to click around, but nothing you change here is saved. The real Job Tracker is a free
          desktop app that stores everything locally on your own computer.
        </p>
      </div>
    </Dialog>
  );
}
