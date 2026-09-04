"use client";

import { useSyncExternalStore } from "react";
import { Dialog, Button } from "@/components/ds";

const STORAGE_KEY = "job-tracker:demo-notice-dismissed";

let dismissed = false;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): boolean {
  if (dismissed || window.electronAPI) return false;
  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return false;
  } catch {
    // localStorage unavailable (e.g. private browsing) — fall through and show the notice
  }
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function dismiss() {
  dismissed = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // if storage isn't available the notice will just show again next visit
  }
  listeners.forEach((listener) => listener());
}

/** Only rendered in the web build (never Electron, where window.electronAPI is present).
 * Shows once per browser to explain that this is a portfolio demo with fake, unsaved data.
 * Uses useSyncExternalStore (rather than an effect) so the client-only "should show" check
 * doesn't cause a setState-in-effect cascade — it renders closed on the server and syncs to
 * the real value right after hydration, which is exactly this hook's intended use case. */
export function DemoNoticeDialog() {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
